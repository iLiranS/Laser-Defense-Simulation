import { create } from 'zustand'
import * as THREE from 'three'
import type {
    ActiveMissile,
    ActiveInterceptor,
    DefenseAlgorithm,
    SimulationPhase,
    SimulationResult,
    ScenarioSnapshot,
    WaveConfig,
    MissileTypeBreakdown,
    ZoneBreakdown,
    MultiRunComparisonResults,
} from '../types/simulationTypes'
import { MissileType, ZoneType } from '../types/global'
import { sphericalToCartesian } from '../utils/coordconvertions'


interface SimulationStore {
    // ── State ──
    activeMissiles: Map<string, ActiveMissile>
    activeInterceptors: Map<string, ActiveInterceptor>
    algorithm: DefenseAlgorithm
    phase: SimulationPhase
    elapsedTime: number
    currentWave: number
    totalWaves: number

    // Radar (global detection sphere)
    radarCenter: THREE.Vector3
    radarRadius: number

    // Wave configuration
    waveConfig: WaveConfig

    // Results
    results: SimulationResult | null
    comparisonResults: MultiRunComparisonResults | null
    scenarioSnapshot: ScenarioSnapshot | null

    // ── Actions ──
    setAlgorithm: (algorithm: DefenseAlgorithm) => void
    setPhase: (phase: SimulationPhase) => void
    setRadarCenter: (center: THREE.Vector3) => void
    setRadarRadius: (radius: number) => void
    setWaveConfig: (config: Partial<WaveConfig>) => void
    setTotalWaves: (count: number) => void

    // Missile management
    registerMissile: (missile: ActiveMissile) => void
    updateMissile: (id: string, updates: Partial<ActiveMissile>) => void
    removeMissile: (id: string) => void

    // Interceptor management
    registerInterceptor: (interceptor: ActiveInterceptor) => void
    clearInterceptors: () => void

    // Simulation control
    startSimulation: () => void
    reset: () => void
    advanceTime: (delta: number) => void
    incrementWave: () => void
    finishSimulation: (result: SimulationResult) => void
    saveSnapshot: (snapshot: ScenarioSnapshot) => void
    setComparisonResults: (results: MultiRunComparisonResults) => void
}

export const useSimulationStore = create<SimulationStore>()((set, _) => ({
    // ── Initial State ──
    activeMissiles: new Map(),
    activeInterceptors: new Map(),
    algorithm: 'smart',
    phase: 'IDLE',
    elapsedTime: 0,
    currentWave: 0,
    totalWaves: 5,

    radarCenter: sphericalToCartesian({ lat: 31.77 * (Math.PI / 180), long: 35.21 * (Math.PI / 180) }).normalize(), // Centers around Jerusalem
    radarRadius: 0.15,

    waveConfig: {
        missileCount: 35,
        interval: 7,
        jitterRange: 0.4,
        ratios: {
            light: 0.6,
            medium: 0.25,
            heavy: 0.15,
        },
        zoneRatios: {
            city: 0.65,
            rural: 0.28,
            open: 0.07,
        },
    },

    results: null,
    comparisonResults: null,
    scenarioSnapshot: null,

    // ── Actions ──
    setAlgorithm: (algorithm) => set({ algorithm }),
    setPhase: (phase) => set({ phase }),
    setRadarCenter: (radarCenter) => set({ radarCenter }),
    setRadarRadius: (radarRadius) => set({ radarRadius }),
    setWaveConfig: (config) => set((s) => ({
        waveConfig: { ...s.waveConfig, ...config },
    })),
    setTotalWaves: (totalWaves) => set({ totalWaves }),

    registerMissile: (missile) => set((s) => {
        const next = new Map(s.activeMissiles)
        next.set(missile.id, missile)
        return { activeMissiles: next }
    }),

    updateMissile: (id, updates) => set((s) => {
        const next = new Map(s.activeMissiles)
        const existing = next.get(id)
        if (existing) {
            next.set(id, { ...existing, ...updates })
        }
        return { activeMissiles: next }
    }),

    removeMissile: (id) => set((s) => {
        const next = new Map(s.activeMissiles)
        next.delete(id)
        return { activeMissiles: next }
    }),

    registerInterceptor: (interceptor) => set((s) => {
        const next = new Map(s.activeInterceptors)
        next.set(interceptor.id, interceptor)
        return { activeInterceptors: next }
    }),

    clearInterceptors: () => set({ activeInterceptors: new Map() }),

    startSimulation: () => set((state) => ({
        phase: 'RUNNING',
        elapsedTime: 0,
        currentWave: 0,
        results: null,
        activeMissiles: new Map(),
        activeInterceptors: new Map(
            [...state.activeInterceptors.entries()].map(([id, i]) => [
                id,
                { ...i, status: 'IDLE' as const, currentTargetId: null },
            ]),
        ),
    })),

    reset: () => set((state) => ({
        phase: 'IDLE',
        elapsedTime: 0,
        currentWave: 0,
        results: null,
        comparisonResults: null,
        activeMissiles: new Map(),
        // Reset interceptors to IDLE
        activeInterceptors: new Map(
            [...state.activeInterceptors.entries()].map(([id, i]) => [
                id,
                { ...i, status: 'IDLE' as const, currentTargetId: null },
            ]),
        ),
    })),

    advanceTime: (delta) => set((s) => ({ elapsedTime: s.elapsedTime + delta })),

    incrementWave: () => set((s) => ({ currentWave: s.currentWave + 1 })),

    finishSimulation: (result) => set({ results: result, phase: 'FINISHED' }),

    saveSnapshot: (snapshot) => set({ scenarioSnapshot: snapshot }),

    setComparisonResults: (comparisonResults) => set({ comparisonResults }),
}))

/**
 * Helper: compute SimulationResult from current missile states.
 * Only counts missiles that pose a threat (impactDamage > 0) in the main stats.
 * SEA-zone missiles are tracked separately as "missed" (no target to protect).
 */
export function computeResults(
    missiles: Map<string, ActiveMissile>,
    algorithm: DefenseAlgorithm,
): SimulationResult {
    let intercepted = 0
    let impacted = 0
    let lostCauses = 0
    let totalDamage = 0
    let totalPossibleDamage = 0
    let threatCount = 0
    let missedCount = 0

    const breakdownMap = new Map<MissileType, MissileTypeBreakdown>()
    for (const t of [MissileType.LIGHT, MissileType.MEDIUM, MissileType.HEAVY]) {
        breakdownMap.set(t, { type: t, count: 0, intercepted: 0, impacted: 0 })
    }

    const zoneMap = new Map<ZoneType, ZoneBreakdown>()
    for (const z of [ZoneType.CITY, ZoneType.RURAL, ZoneType.OPEN]) {
        zoneMap.set(z, { zone: z, count: 0, intercepted: 0 })
    }

    for (const missile of missiles.values()) {
        // Count SEA-zone missiles as "missed" — not a threat
        if (missile.impactDamage <= 0) {
            missedCount++
            continue
        }

        threatCount++
        totalPossibleDamage += missile.impactDamage
        const bd = breakdownMap.get(missile.missileType)!
        bd.count++

        // Zone breakdown
        const zbd = zoneMap.get(missile.impactZone)
        if (zbd) {
            zbd.count++
        }

        switch (missile.status) {
            case 'INTERCEPTED':
                intercepted++
                bd.intercepted++
                if (zbd) zbd.intercepted++
                break
            case 'IMPACTED':
                impacted++
                totalDamage += missile.impactDamage
                bd.impacted++
                break
            case 'LOST_CAUSE':
                lostCauses++
                totalDamage += missile.impactDamage
                bd.impacted++ // lost causes count as impacted damage
                break
        }
    }

    return {
        algorithm,
        totalMissiles: threatCount,
        totalLaunched: missiles.size,
        intercepted,
        impacted: impacted + lostCauses,
        lostCauses,
        missedCount,
        totalDamage,
        totalPossibleDamage,
        missileBreakdown: [...breakdownMap.values()],
        zoneBreakdown: [...zoneMap.values()],
    }
}
