import { useRef, useEffect, useMemo } from "react"
import { useInterceptorsStore } from "../../store/InterceptorsStore"
import { useGameManagerStore } from "../../store/gameManagerStore"
import { useSimulationStore } from "../../store/simulationStore"
import * as THREE from 'three'
import { useFrame } from "@react-three/fiber"
import LaserBeam from "./LaserBeam"
import { CITIES, type City } from "../../data/cityData"

// interceptor geometry/material
const boxGeo = new THREE.BoxGeometry(1, 1, 1)
const boxMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.1, 4, 0.1)
})

// distribute interceptors across cities
const getDistributedInterceptors = (count: number, cities: City[], placementRadius: number) => {
    return Array.from({ length: count }, (_, i) => {
        // Round-robin distribution among cities
        const city = cities[i % cities.length]
        const center = city.cartesianPos

        // Very small random spread around the city center (within city radius)
        const spreadAngle = Math.random() * city.radius * 0.5
        const randomVec = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize()
        const axis = new THREE.Vector3().crossVectors(center, randomVec).normalize()

        const pos = center.clone().applyAxisAngle(axis, spreadAngle).setLength(placementRadius)

        return {
            id: `interceptor-${i}`,
            position: pos,
        }
    })
}

// temp objects
const tempMatrix = new THREE.Matrix4()
const tempQuat = new THREE.Quaternion()
const up = new THREE.Vector3(0, 1, 0)
const normal = new THREE.Vector3()
const pos = new THREE.Vector3()

export default function InterceptorsManager() {

    const { interceptors, setInterceptors } = useInterceptorsStore()

    const interceptorMeshRef = useRef<THREE.InstancedMesh>(null)

    const interceptorsCount = useGameManagerStore(s => s.interceptorsCount)
    const radius = useGameManagerStore(s => s.radius)

    const simPhase = useSimulationStore(s => s.phase)
    const showInterceptors = useGameManagerStore(s => s.showInterceptors)

    // Generate interceptors and register in simulation store (only when IDLE)
    useEffect(() => {
        if (simPhase !== 'IDLE') return

        const simStore = useSimulationStore.getState()
        const randInterceptors = getDistributedInterceptors(interceptorsCount, CITIES, radius)
        setInterceptors(randInterceptors)

        // Register in simulation store
        simStore.clearInterceptors()
        for (const entry of randInterceptors) {
            simStore.registerInterceptor({
                id: entry.id,
                position: entry.position.clone(),
                status: 'IDLE',
                currentTargetId: null,
            })
        }
    }, [interceptorsCount, radius, setInterceptors, simPhase])

    // update interceptor transforms
    useEffect(() => {
        if (!interceptorMeshRef.current) return

        interceptors.forEach((interceptor, i) => {
            pos.set(interceptor.position.x, interceptor.position.y, interceptor.position.z)
            normal.copy(pos).normalize()
            tempQuat.setFromUnitVectors(up, normal)
            const scale = 0.01
            pos.addScaledVector(normal, scale * 0.5)

            tempMatrix.compose(
                pos.clone(),
                tempQuat,
                new THREE.Vector3(scale, scale, scale)
            )

            if (interceptorMeshRef.current) interceptorMeshRef.current.setMatrixAt(i, tempMatrix)
        })

        interceptorMeshRef.current.instanceMatrix.needsUpdate = true
    }, [interceptors, showInterceptors])

    // Read active interceptor states for laser beams
    const activeInterceptors = useSimulationStore(s => s.activeInterceptors)
    const activeMissiles = useSimulationStore(s => s.activeMissiles)

    // Build laser beam data
    const laserBeams = useMemo(() => {
        const beams: { interceptorPos: THREE.Vector3; targetPos: THREE.Vector3; dwellProgress: number }[] = []

        for (const interceptor of activeInterceptors.values()) {
            if (interceptor.status !== 'ENGAGING' || !interceptor.currentTargetId) continue

            const target = activeMissiles.get(interceptor.currentTargetId)
            if (!target || target.status !== 'DETECTED') continue

            // Get current missile position along its curve
            const missilePos = target.curve.getPoint(target.progress)
            const dwellProgress = 1 - (target.dwellTimeRemaining / target.dwellTimeTotal)

            beams.push({
                interceptorPos: interceptor.position,
                targetPos: missilePos,
                dwellProgress,
            })
        }

        return beams
    }, [activeInterceptors, activeMissiles])

    // Force re-render for beam updates
    useFrame(() => {
        // This triggers React to re-read the store each frame for beam positions
    })


    return (
        <>
            {/* MAIN INTERCEPTORS - Visually hide only the boxes if showInterceptors is false */}
            {showInterceptors && (
                <instancedMesh
                    ref={interceptorMeshRef}
                    args={[boxGeo, boxMat, interceptors.length]}
                />
            )}

            {/* LASER BEAMS - Always show these when active */}
            {laserBeams.map((beam, i) => (
                <LaserBeam
                    key={`beam-${i}`}
                    interceptorPos={beam.interceptorPos}
                    targetPos={beam.targetPos}
                    dwellProgress={beam.dwellProgress}
                />
            ))}
        </>
    )
}
