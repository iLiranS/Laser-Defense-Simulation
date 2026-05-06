import * as THREE from 'three'
import type { MissileType } from './global'
import { ZoneType } from './global'
import type { PhysicsProjectileCurve } from '../objects/missile/utils/physicsProjectileCurve'


// ── Defense Algorithm Selection ──
export type DefenseAlgorithm = 'naive' | 'smart' | 'smartGamma'

// ── Missile Runtime State ──
export type MissileStatus = 'FLYING' | 'DETECTED' | 'INTERCEPTED' | 'IMPACTED' | 'LOST_CAUSE'

export interface ActiveMissile {
    id: string
    curve: PhysicsProjectileCurve
    missileType: MissileType
    impactZone: ZoneType             // classified at detection time
    impactDamage: number             // V_i = W_i * Z_i
    TTI: number                      // seconds remaining to impact, computed at detection, decremented each tick
    dwellTimeTotal: number           // full dwell time for this missile type
    dwellTimeRemaining: number       // D_rem — decreases while being engaged
    progress: number                 // 0..1 position along the ballistic curve
    elapsedTime: number              // seconds since this missile spawned
    detectedTime: number | null      // sim-time when missile entered radar sphere (null if not yet detected)
    status: MissileStatus
    score: number                    // S_i(t), recomputed each tick for detected missiles
    predictedImpactPos: THREE.Vector3 | null  // computed at detection via predictMissileImpact
    sourcePos: THREE.Vector3
    targetPos: THREE.Vector3
    spawnDelay: number               // jitter offset within its wave (seconds)
}

// ── Interceptor Runtime State ──
export type InterceptorStatus = 'IDLE' | 'ENGAGING'

export interface ActiveInterceptor {
    id: string
    position: THREE.Vector3
    status: InterceptorStatus
    currentTargetId: string | null
}

// ── Wave Configuration ──
export interface WaveConfig {
    missileCount: number
    interval: number                 // seconds between waves
    jitterRange: number              // max random delay per missile within a wave (e.g. 0.3s)
    ratios: {
        light: number
        medium: number
        heavy: number
    }
    zoneRatios: {
        city: number
        rural: number
        open: number
    }
}

// ── Simulation Results (per algorithm run) ──
export interface MissileTypeBreakdown {
    type: MissileType
    count: number
    intercepted: number
    impacted: number
}

export interface ZoneBreakdown {
    zone: ZoneType
    count: number
    intercepted: number
}

export interface SimulationResult {
    algorithm: DefenseAlgorithm
    totalMissiles: number            // only threats (non-SEA)
    totalLaunched: number            // all missiles including SEA misses
    intercepted: number
    impacted: number
    lostCauses: number
    missedCount: number              // missiles that landed in SEA (ignored)
    totalDamage: number              // sum of V_i for missiles that impacted
    totalPossibleDamage: number      // sum of V_i for all missiles
    missileBreakdown: MissileTypeBreakdown[]
    zoneBreakdown: ZoneBreakdown[]
}

// ── Scenario Snapshot (for comparison replay) ──
// Stores the exact missile configuration so both algorithms run on identical input
export interface MissileSnapshot {
    source: THREE.Vector3
    target: THREE.Vector3
    missileType: MissileType
    spawnDelay: number
}

export interface ScenarioSnapshot {
    missiles: MissileSnapshot[]
    interceptorPositions: THREE.Vector3[]
    radarCenter: THREE.Vector3
    radarRadius: number
    waveConfig: WaveConfig
}

// ── Simulation Phase ──
export type SimulationPhase = 'IDLE' | 'RUNNING' | 'FINISHED' | 'COMPARING'

// ── Multi-Run Comparison Results ──
export interface MultiRunComparisonResults {
    runs: { naive: SimulationResult; smart: SimulationResult; smartGamma: SimulationResult }[]
}
