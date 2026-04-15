import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSimulationStore } from '../store/simulationStore'
import { useGameManagerStore } from '../store/gameManagerStore'
import {
    simulationTick,
    generateWaveSnapshots,
    createActiveMissile,
} from './simulationLoop'
import type { MissileSnapshot } from '../types/simulationTypes'

/**
 * SimulationController — runs inside the R3F Canvas.
 * Drives the simulation tick on every frame and handles wave spawning.
 * Renders nothing visual itself.
 */
export default function SimulationController() {
    const { simulationSpeed, gravity, missileSpeed, radius } = useGameManagerStore()
    const lastWaveTime = useRef(0)

    useFrame((_state, delta) => {
        const store = useSimulationStore.getState()

        if (store.phase !== 'RUNNING') return

        const scaledDelta = delta * simulationSpeed

        // ── Wave spawning ──
        const waveInterval = store.waveConfig.interval

        // Reset wave timer when starting a new simulation run
        if (store.currentWave === 0 && store.elapsedTime < 0.1) {
            lastWaveTime.current = 0
        }

        const timeSinceLastWave = store.elapsedTime - lastWaveTime.current

        if (store.currentWave < store.totalWaves && (store.currentWave === 0 || timeSinceLastWave >= waveInterval)) {
            const waveIndex = store.currentWave
            const waveStartTime = store.elapsedTime
            const waveSize = store.waveConfig.missileCount

            // Use pre-generated snapshot if available, otherwise generate fresh
            let waveSlice: MissileSnapshot[]
            if (store.scenarioSnapshot) {
                waveSlice = store.scenarioSnapshot.missiles.slice(
                    waveIndex * waveSize,
                    (waveIndex + 1) * waveSize,
                )
            } else {
                waveSlice = generateWaveSnapshots(store.waveConfig, waveIndex, radius, store.radarCenter)
            }

            // Register missiles
            for (let i = 0; i < waveSlice.length; i++) {
                const missile = createActiveMissile(
                    waveSlice[i],
                    waveStartTime,
                    i,
                    waveIndex,
                    missileSpeed,
                    gravity,
                )
                store.registerMissile(missile)
            }

            lastWaveTime.current = store.elapsedTime
            store.incrementWave()
        }

        // ── Main simulation tick ──
        simulationTick(scaledDelta, missileSpeed, gravity)
    })

    // Render radar sphere visualization
    const radarCenter = useSimulationStore(s => s.radarCenter)
    const radarRadius = useSimulationStore(s => s.radarRadius)
    const showRadarRadius = useGameManagerStore(s => s.showRadarRadius)

    if (!showRadarRadius) return null

    return (
        <mesh position={radarCenter}>
            <sphereGeometry args={[radarRadius, 32, 16]} />
            <meshBasicMaterial
                color={new THREE.Color(0.1, 0.5, 1.0)}
                transparent
                opacity={0.06}
                side={THREE.BackSide}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </mesh>
    )
}
