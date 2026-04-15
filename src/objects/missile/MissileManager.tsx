import { useEffect, useRef } from "react"
import { useGameManagerStore } from "../../store/gameManagerStore"
import { useSimulationStore } from "../../store/simulationStore"
import Missile from "./Missile"
import * as THREE from 'three'
import { useFrame } from "@react-three/fiber"

const missileGeometry = new THREE.BoxGeometry(1, 1, 2)
const missileMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(7, 1, 1) })

/**
 * MissileManager — renders visual representations of all active missiles
 * in the simulation store.
 * 
 * No longer generates/manages missiles directly — the SimulationController
 * handles spawning. This component purely reads from the simulation store
 * and renders the visuals.
 */
const MissileManager = () => {
    const radius = useGameManagerStore(s => s.radius)
    const { simulationSpeed, gravity, missileSpeed } = useGameManagerStore()
    const activeMissiles = useSimulationStore(s => s.activeMissiles)
    const phase = useSimulationStore(s => s.phase)
    const meshRef = useRef<THREE.InstancedMesh>(null)

    // Reset instanced mesh when simulation restarts
    useEffect(() => {
        if (meshRef.current && phase === 'IDLE') {
            for (let i = 0; i < meshRef.current.count; i++) {
                const m = new THREE.Matrix4().makeScale(0, 0, 0)
                meshRef.current.setMatrixAt(i, m)
            }
            meshRef.current.instanceMatrix.needsUpdate = true
        }
    }, [phase])

    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.instanceMatrix.needsUpdate = true
        }
    })

    // Convert map to array for rendering
    const missileEntries = [...activeMissiles.entries()]
    const maxInstances = 250 // Use a fixed large enough buffer to avoid constant reallocations

    return (
        <>
            {phase !== 'IDLE' && missileEntries.map(([id, missile], index) => (
                <Missile
                    key={id}
                    missileId={id}
                    source={missile.sourcePos}
                    target={missile.targetPos}
                    radius={radius}
                    instanceId={index}
                    instancedMeshRef={meshRef}
                    missileType={missile.missileType}
                    speed={missileSpeed}
                    gravity={gravity}
                    simulationSpeed={simulationSpeed}
                />
            ))}

            {/* Missiles instanced mesh */}
            <instancedMesh
                ref={meshRef}
                args={[missileGeometry, missileMaterial, maxInstances]}
                onUpdate={(self) => {
                    // Initialize all matrices to scale 0 on first load
                    if (self.userData.initialized) return
                    const matrix = new THREE.Matrix4().makeScale(0, 0, 0)
                    for (let i = 0; i < maxInstances; i++) {
                        self.setMatrixAt(i, matrix)
                    }
                    self.instanceMatrix.needsUpdate = true
                    self.userData.initialized = true
                }}
            />
        </>
    )
}
export default MissileManager