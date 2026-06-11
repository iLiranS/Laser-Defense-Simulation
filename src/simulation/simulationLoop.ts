import * as THREE from 'three'
import { T_SAFETY, DWELL_TIME, MissileType, ZoneType } from '../types/global'
import type { ActiveMissile, WaveConfig, MissileSnapshot } from '../types/simulationTypes'
import { classifyImpactZone, CITIES, type City } from '../data/cityData'
import { predictMissileImpact } from '../objects/missile/utils/predictMissileImpact'
import { PhysicsProjectileCurve } from '../objects/missile/utils/physicsProjectileCurve'
import { runAssignment } from './assignmentEngine'
import { useSimulationStore, computeResults } from '../store/simulationStore'

/**
 * Generates a random MissileType based on the configured distribution.
 */
export function randomMissileType(ratios: { light: number, medium: number, heavy: number }): MissileType {
    const roll = Math.random()
    // We normalize to ensure they sum to 1 if coming from UI jitter
    const total = ratios.light + ratios.medium + ratios.heavy
    const l = ratios.light / total
    const m = ratios.medium / total

    if (roll < l) return MissileType.LIGHT
    if (roll < l + m) return MissileType.MEDIUM
    return MissileType.HEAVY
}

/**
 * Creates an ActiveMissile record from a snapshot entry.
 * The missile starts in FLYING state — it hasn't entered the radar sphere yet.
 */
export function createActiveMissile(
    snapshot: MissileSnapshot,
    waveStartTime: number,
    missileIndex: number,
    waveIndex: number,
    speed: number,
    gravity: number,
): ActiveMissile {
    const curve = new PhysicsProjectileCurve(
        snapshot.source,
        snapshot.target,
        speed,
        gravity,
    )

    return {
        id: `w${waveIndex}-m${missileIndex}`,
        curve,
        missileType: snapshot.missileType,
        impactZone: 0,           // classified at detection
        impactDamage: 0,         // computed at detection
        TTI: curve.totalTime,    // initial estimate, updated at detection
        dwellTimeTotal: DWELL_TIME[snapshot.missileType],
        dwellTimeRemaining: DWELL_TIME[snapshot.missileType],
        progress: 0,
        elapsedTime: 0,
        detectedTime: null,
        status: 'FLYING',
        score: 0,
        predictedImpactPos: null,
        sourcePos: snapshot.source.clone(),
        targetPos: snapshot.target.clone(),
        spawnDelay: waveStartTime + snapshot.spawnDelay,
    }
}

/**
 * Main simulation tick — called every frame by SimulationController.
 * 
 * Advances all missiles, handles detection, dwell time reduction,
 * and runs the assignment engine.
 */
export function simulationTick(
    delta: number,
    _speed: number,
    gravity: number,
): void {
    const store = useSimulationStore.getState()

    if (store.phase !== 'RUNNING') return

    const scaledDelta = delta
    store.advanceTime(scaledDelta)

    const { activeMissiles, activeInterceptors, algorithm, radarCenter, radarRadius, elapsedTime, maxInterceptorsPerMissile } = store

    // We'll work directly with the store's map references for performance
    // and batch the update via a single set call at the end
    let anyChanged = false

    // ── Process each missile ──
    for (const missile of activeMissiles.values()) {
        // Skip missiles not yet spawned (jitter delay)
        if (elapsedTime < missile.spawnDelay) continue

        // Skip resolved missiles
        if (missile.status === 'INTERCEPTED' || missile.status === 'IMPACTED' || missile.status === 'LOST_CAUSE') continue

        // Advance time and position
        const actualElapsed = elapsedTime - missile.spawnDelay
        // Scale up total flight time for visualization so it takes ~10-15 seconds instead of 0.1s
        const totalFlightTime = missile.curve.totalTime * 25

        if (totalFlightTime <= 0) {
            missile.status = 'IMPACTED'
            anyChanged = true
            continue
        }

        missile.elapsedTime = actualElapsed
        missile.progress = Math.min(actualElapsed / totalFlightTime, 1.0)

        // ── Detection check ──
        if (missile.status === 'FLYING') {
            const currentPos = missile.curve.getPoint(missile.progress)
            const distToRadar = currentPos.distanceTo(radarCenter)

            if (distToRadar <= radarRadius) {
                // Missile entered radar sphere — compute TTI and classify
                missile.status = 'DETECTED'
                missile.detectedTime = elapsedTime

                // Estimate velocity at current point for prediction
                const tinyStep = 0.001
                const p1 = currentPos
                const p2 = missile.curve.getPoint(Math.min(missile.progress + tinyStep, 1.0))
                const timeDelta = tinyStep * totalFlightTime
                const velocity = p2.clone().sub(p1).divideScalar(timeDelta)

                const prediction = predictMissileImpact(p1, velocity, gravity, 1)
                if (prediction) {
                    missile.predictedImpactPos = prediction.impactPosition
                    // TTI must be scaled by 25 to match the visual flight time scaling
                    missile.TTI = prediction.timeToImpact * 25
                } else {
                    // Fallback: use remaining flight time
                    missile.TTI = totalFlightTime - actualElapsed
                    missile.predictedImpactPos = missile.targetPos.clone()
                }

                // Classify impact zone based on missile's intended target
                // (using targetPos rather than predictedImpactPos since predictions
                // can diverge from the actual trajectory on a curved surface)
                missile.impactZone = classifyImpactZone(missile.targetPos)
                missile.impactDamage = missile.missileType * missile.impactZone

                anyChanged = true
            }
        }

        // ── TTI countdown for detected missiles ──
        if (missile.status === 'DETECTED') {
            missile.TTI = Math.max(0, missile.TTI - scaledDelta)

            // Check if currently being engaged (how many interceptors are targeting this missile)
            let engagingCount = 0
            for (const interceptor of activeInterceptors.values()) {
                if (interceptor.currentTargetId === missile.id && interceptor.status === 'ENGAGING') {
                    engagingCount++
                }
            }

            // Reduce dwell time if being engaged
            if (engagingCount > 0) {
                missile.dwellTimeRemaining = Math.max(0, missile.dwellTimeRemaining - (scaledDelta * engagingCount))

                // Successfully intercepted!
                if (missile.dwellTimeRemaining <= 0) {
                    missile.status = 'INTERCEPTED'
                    anyChanged = true
                    continue
                }
            }

            const maxPossibleDrainRate = maxInterceptorsPerMissile // Up to max allowed interceptors
            const theoreticalMinTimeNeeded = missile.dwellTimeRemaining / maxPossibleDrainRate

            // Lost cause check — skip missiles that can't be intercepted in time even with max interceptors
            if (engagingCount === 0 && missile.TTI < theoreticalMinTimeNeeded + T_SAFETY) {
                missile.status = 'LOST_CAUSE'
                anyChanged = true
                continue
            }

            anyChanged = true
        }

        // ── Impact check (reached ground) ──
        if (missile.progress >= 1.0) {
            missile.status = 'IMPACTED'
            anyChanged = true
        }
    }

    // ── Run assignment engine ──
    runAssignment(activeMissiles, activeInterceptors, algorithm, maxInterceptorsPerMissile)

    // ── Check completion ──
    const allResolved = checkAllResolved(activeMissiles, elapsedTime)
    if (allResolved) {
        const result = computeResults(activeMissiles, algorithm)

        console.log(
            `[Simulation] Finished: algorithm=${algorithm}, interceptors=${activeInterceptors.size}, ` +
            `threats=${result.totalMissiles}, missed=${result.missedCount}, intercepted=${result.intercepted}, ` +
            `impacted=${result.impacted}, lostCauses=${result.lostCauses}, damage=${result.totalDamage.toFixed(2)}`
        )

        store.finishSimulation(result)
    }

    // Force a store update if anything changed so React picks it up
    if (anyChanged) {
        useSimulationStore.setState({
            activeMissiles: new Map(activeMissiles),
            activeInterceptors: new Map(activeInterceptors),
        })
    }
}

/**
 * Check if all missiles have been resolved (no more FLYING or DETECTED).
 */
function checkAllResolved(
    missiles: Map<string, ActiveMissile>,
    elapsedTime: number,
): boolean {
    if (missiles.size === 0) return false

    for (const missile of missiles.values()) {
        // Still waiting to spawn
        if (elapsedTime < missile.spawnDelay) return false
        // Still active
        if (missile.status === 'FLYING' || missile.status === 'DETECTED') return false
    }

    return true
}

/** Pick a random city weighted by zone type. */
function pickWeightedCity(ratios: { city: number, rural: number, open: number }): City {
    const roll = Math.random()
    const total = ratios.city + ratios.rural + ratios.open
    const c = ratios.city / total
    const r = ratios.rural / total

    let targetZone = ZoneType.CITY
    if (roll < c) targetZone = ZoneType.CITY
    else if (roll < c + r) targetZone = ZoneType.RURAL
    else targetZone = ZoneType.OPEN

    const candidates = CITIES.filter(city => city.zoneType === targetZone)
    if (candidates.length > 0) {
        return candidates[Math.floor(Math.random() * candidates.length)]
    }

    // Fallback: pick any city if no candidates in zone (should not happen with default data)
    return CITIES[Math.floor(Math.random() * CITIES.length)]
}

/**
 * Generates missile snapshots for a wave.
 * Each missile targets a random city with slight inaccuracy —
 * ~93% land inside a city zone, ~7% miss due to targeting error.
 * Zone targeting ratio: 60% City, 30% Rural, 10% Open.
 */
export function generateWaveSnapshots(
    waveConfig: WaveConfig,
    _waveIndex: number,
    radius: number,
    _radarCenter: THREE.Vector3
): MissileSnapshot[] {
    const randomPointOnSphere = (r: number): THREE.Vector3 => {
        const u = Math.random()
        const v = Math.random()
        const theta = 2 * Math.PI * u
        const phi = Math.acos(2 * v - 1)
        return new THREE.Vector3(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi),
        )
    }

    const snapshots: MissileSnapshot[] = []

    for (let i = 0; i < waveConfig.missileCount; i++) {
        // Pick a target city with zone-weighted probability
        const city = pickWeightedCity(waveConfig.zoneRatios)

        // Apply a small random offset — ~93% land within the city radius, ~7% miss
        // offset ∈ [0, radius * 1.075] → P(within radius) ≈ 1/1.075 ≈ 93%
        const maxOffset = city.radius * 1.075
        const offsetAngle = Math.random() * maxOffset
        const randomVec = new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5,
        ).normalize()
        const axis = new THREE.Vector3().crossVectors(city.cartesianPos, randomVec).normalize()
        const target = city.cartesianPos.clone().applyAxisAngle(axis, offsetAngle).setLength(radius)

        snapshots.push({
            source: randomPointOnSphere(radius),
            target,
            missileType: randomMissileType(waveConfig.ratios),
            spawnDelay: Math.random() * waveConfig.jitterRange,
        })
    }

    return snapshots
}
