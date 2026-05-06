import * as THREE from 'three'
import { T_SAFETY, MAX_INTERCEPTORS_PER_MISSILE } from '../types/global'
import type { ActiveMissile, ActiveInterceptor, DefenseAlgorithm, WaveConfig, MissileSnapshot, SimulationResult } from '../types/simulationTypes'
import { classifyImpactZone } from '../data/cityData'
import { predictMissileImpact } from '../objects/missile/utils/predictMissileImpact'
import { createActiveMissile } from './simulationLoop'
import { runAssignment } from './assignmentEngine'
import { computeResults } from '../store/simulationStore'

/**
 * Configuration for a headless (non-visual) simulation run.
 */
export interface HeadlessSimConfig {
    missiles: MissileSnapshot[]
    waveConfig: WaveConfig
    totalWaves: number
    interceptorPositions: THREE.Vector3[]
    radarCenter: THREE.Vector3
    radarRadius: number
    algorithm: DefenseAlgorithm
    speed: number
    gravity: number
}

/**
 * Runs a complete simulation without any visual rendering.
 * Used by the multi-run comparison mode to quickly evaluate both
 * algorithms on the same scenario.
 *
 * Replicates the exact same logic as simulationTick + SimulationController
 * but operates on local data instead of the Zustand store.
 *
 * @returns SimulationResult with final stats
 */
export function runHeadlessSimulation(config: HeadlessSimConfig): SimulationResult {
    const {
        missiles: missileSnapshots, waveConfig, totalWaves,
        interceptorPositions, radarCenter, radarRadius,
        algorithm, speed, gravity,
    } = config

    // Create interceptors
    const interceptors = new Map<string, ActiveInterceptor>()
    for (let i = 0; i < interceptorPositions.length; i++) {
        const id = `interceptor-${i}`
        interceptors.set(id, {
            id,
            position: interceptorPositions[i].clone(),
            status: 'IDLE' as const,
            currentTargetId: null,
        })
    }

    const activeMissiles = new Map<string, ActiveMissile>()
    const TICK_DELTA = 1 / 60 // ~60fps equivalent
    const waveSize = waveConfig.missileCount

    let elapsedTime = 0
    let currentWave = 0
    let lastWaveTime = 0

    // Main simulation loop — runs until all missiles are resolved or safety timeout
    while (elapsedTime < 600) {
        elapsedTime += TICK_DELTA

        // ── Wave spawning ──
        const timeSinceLastWave = elapsedTime - lastWaveTime
        if (currentWave < totalWaves &&
            (currentWave === 0 || timeSinceLastWave >= waveConfig.interval)) {
            const waveSlice = missileSnapshots.slice(
                currentWave * waveSize,
                (currentWave + 1) * waveSize,
            )
            for (let i = 0; i < waveSlice.length; i++) {
                const missile = createActiveMissile(
                    waveSlice[i], elapsedTime, i, currentWave, speed, gravity,
                )
                activeMissiles.set(missile.id, missile)
            }
            lastWaveTime = elapsedTime
            currentWave++
        }

        // ── Process each missile ──
        processMissiles(activeMissiles, interceptors, elapsedTime, radarCenter, radarRadius, gravity, algorithm, TICK_DELTA)

        // ── Run assignment engine ──
        runAssignment(activeMissiles, interceptors, algorithm)

        // ── Check completion ──
        if (activeMissiles.size > 0 && allResolved(activeMissiles, elapsedTime)) {
            return computeResults(activeMissiles, algorithm)
        }
    }

    return computeResults(activeMissiles, algorithm)
}

/**
 * Process all missiles for one tick — detection, TTI, dwell, lost cause, impact.
 * Mirrors the logic in simulationLoop.simulationTick but operates on local data.
 */
function processMissiles(
    missiles: Map<string, ActiveMissile>,
    interceptors: Map<string, ActiveInterceptor>,
    elapsedTime: number,
    radarCenter: THREE.Vector3,
    radarRadius: number,
    gravity: number,
    _algorithm: DefenseAlgorithm,
    delta: number,
): void {
    for (const missile of missiles.values()) {
        if (elapsedTime < missile.spawnDelay) continue
        if (missile.status === 'INTERCEPTED' || missile.status === 'IMPACTED' || missile.status === 'LOST_CAUSE') continue

        const actualElapsed = elapsedTime - missile.spawnDelay
        const totalFlightTime = missile.curve.totalTime * 25

        if (totalFlightTime <= 0) {
            missile.status = 'IMPACTED'
            continue
        }

        missile.elapsedTime = actualElapsed
        missile.progress = Math.min(actualElapsed / totalFlightTime, 1.0)

        // ── Detection check ──
        if (missile.status === 'FLYING') {
            const currentPos = missile.curve.getPoint(missile.progress)
            const distToRadar = currentPos.distanceTo(radarCenter)

            if (distToRadar <= radarRadius) {
                missile.status = 'DETECTED'
                missile.detectedTime = elapsedTime

                const tinyStep = 0.001
                const p1 = currentPos
                const p2 = missile.curve.getPoint(Math.min(missile.progress + tinyStep, 1.0))
                const timeDelta = tinyStep * totalFlightTime
                const velocity = p2.clone().sub(p1).divideScalar(timeDelta)

                const prediction = predictMissileImpact(p1, velocity, gravity, 1)
                if (prediction) {
                    missile.predictedImpactPos = prediction.impactPosition
                    missile.TTI = prediction.timeToImpact * 25
                } else {
                    missile.TTI = totalFlightTime - actualElapsed
                    missile.predictedImpactPos = missile.targetPos.clone()
                }

                missile.impactZone = classifyImpactZone(missile.targetPos)
                missile.impactDamage = missile.missileType * missile.impactZone
            }
        }

        // ── TTI countdown for detected missiles ──
        if (missile.status === 'DETECTED') {
            missile.TTI = Math.max(0, missile.TTI - delta)

            let engagingCount = 0
            for (const interceptor of interceptors.values()) {
                if (interceptor.currentTargetId === missile.id && interceptor.status === 'ENGAGING') {
                    engagingCount++
                }
            }

            if (engagingCount > 0) {
                missile.dwellTimeRemaining = Math.max(0, missile.dwellTimeRemaining - (delta * engagingCount))
                if (missile.dwellTimeRemaining <= 0) {
                    missile.status = 'INTERCEPTED'
                    continue
                }
            }

            const maxPossibleDrainRate = MAX_INTERCEPTORS_PER_MISSILE
            const theoreticalMinTimeNeeded = missile.dwellTimeRemaining / maxPossibleDrainRate

            // Lost cause — both algorithms
            if (engagingCount === 0 && missile.TTI < theoreticalMinTimeNeeded + T_SAFETY) {
                missile.status = 'LOST_CAUSE'
                continue
            }
        }

        // ── Impact check ──
        if (missile.progress >= 1.0) {
            missile.status = 'IMPACTED'
        }
    }
}

/** Check if all spawned missiles have reached a terminal state. */
function allResolved(missiles: Map<string, ActiveMissile>, elapsedTime: number): boolean {
    for (const missile of missiles.values()) {
        if (elapsedTime < missile.spawnDelay) return false
        if (missile.status === 'FLYING' || missile.status === 'DETECTED') return false
    }
    return true
}
