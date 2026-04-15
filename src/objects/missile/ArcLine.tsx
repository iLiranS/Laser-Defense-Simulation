import * as THREE from 'three'
import { Line } from '@react-three/drei'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { PhysicsProjectileCurve } from './utils/physicsProjectileCurve'
import { useSimulationStore } from '../../store/simulationStore'
import { useGameManagerStore } from '../../store/gameManagerStore'
import type { MissileType } from '../../types/global'


const tempObject = new THREE.Object3D()

type ArcLineProps = {
    missileId: string
    source: THREE.Vector3
    target: THREE.Vector3
    radius: number
    simulationSpeed: number
    color?: THREE.ColorRepresentation | [number, number, number]
    lineWidth?: number
    instanceId: number
    instancedMeshRef: React.RefObject<THREE.InstancedMesh | null>
    speed: number
    gravity: number
    missileType: MissileType
}



const ArcLine: React.FC<ArcLineProps> = ({
    missileId,
    source,
    target,
    simulationSpeed,
    color = 'white',
    lineWidth = 2,
    instanceId,
    instancedMeshRef,
    speed,
    gravity,
    missileType,
}) => {
    void simulationSpeed
    void missileType

    const progressLineRef = useRef(null)
    const showTrajectory = useGameManagerStore(s => s.showTrajectoryPrediction)

    // Build the physics curve
    const curve = useMemo(() => {
        return new PhysicsProjectileCurve(source, target, speed, gravity)
    }, [source, target, speed, gravity])

    const points = useMemo(() => curve.getPoints(50), [curve])
    const totalLength = useMemo(() => curve.getLength(), [curve])
    const lengths = useMemo(() => curve.getLengths(50), [curve])

    const dashSizeVal = useMemo(() => Math.max(totalLength * 0.02, 0.001), [totalLength])
    const gapSizeVal = useMemo(() => Math.max(totalLength * 0.015, 0.01), [totalLength])

    // Track if we've already hidden the mesh
    const hiddenRef = useRef(false)

    useFrame(() => {
        // Read missile state from simulation store
        const missile = useSimulationStore.getState().activeMissiles.get(missileId)
        if (!missile) return

        const progress = missile.progress
        const status = missile.status

        // ── Update progress line ──
        if (progressLineRef.current) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const progressMat = (progressLineRef.current as any).material

            if (status === 'INTERCEPTED' || status === 'IMPACTED' || status === 'LOST_CAUSE') {
                progressMat.opacity = Math.max(0, (progressMat.opacity ?? 1) - 0.05)
            } else {
                // Animate dash offset based on progress
                const sampleIndex = progress * 50
                const lowerIndex = Math.floor(sampleIndex)
                const weight = sampleIndex - lowerIndex
                const distLow = lengths[lowerIndex] ?? 0
                const distHigh = lengths[lowerIndex + 1] ?? lengths[lengths.length - 1]
                const currentDistance = distLow + (distHigh - distLow) * weight
                progressMat.dashOffset = totalLength - currentDistance
            }
        }

        // ── Update instanced mesh position ──
        if (instancedMeshRef.current) {
            if (status === 'INTERCEPTED' || status === 'IMPACTED' || status === 'LOST_CAUSE') {
                if (!hiddenRef.current) {
                    tempObject.scale.set(0, 0, 0)
                    tempObject.updateMatrix()
                    instancedMeshRef.current.setMatrixAt(instanceId, tempObject.matrix)
                    instancedMeshRef.current.instanceMatrix.needsUpdate = true
                    hiddenRef.current = true
                }
            } else {
                const pos = curve.getPoint(progress)
                const tangent = curve.getTangent(progress)

                tempObject.position.copy(pos)
                tempObject.lookAt(pos.clone().add(tangent))
                tempObject.scale.setScalar(0.006)
                tempObject.updateMatrix()
                instancedMeshRef.current.setMatrixAt(instanceId, tempObject.matrix)
                instancedMeshRef.current.instanceMatrix.needsUpdate = true
                hiddenRef.current = false // reset hidden flag if it was hidden
            }
        }
    })

    // Cleanup on unmount: ensure the instance is hidden
    useEffect(() => {
        return () => {
            if (instancedMeshRef.current) {
                tempObject.scale.set(0, 0, 0)
                tempObject.updateMatrix()
                instancedMeshRef.current.setMatrixAt(instanceId, tempObject.matrix)
                instancedMeshRef.current.instanceMatrix.needsUpdate = true
            }
        }
    }, [instanceId, instancedMeshRef])

    return (
        <>
            {/* PREDICTION LINE */}
            {showTrajectory && (
                <Line
                    points={points}
                    color={new THREE.Color(0.57 * 2, 0.44 * 2, 0.86 * 2)}
                    lineWidth={lineWidth / 2}
                    dashed={true}
                    dashSize={dashSizeVal}
                    gapSize={gapSizeVal}
                    dashOffset={0}
                    polygonOffset={true}
                    polygonOffsetFactor={-1}
                    transparent={true}
                />
            )}

            {/* PROGRESS LINE */}
            <Line
                ref={progressLineRef}
                points={points}
                color={color as THREE.ColorRepresentation}
                lineWidth={lineWidth}
                dashed={true}
                dashSize={totalLength}
                gapSize={totalLength}
                dashOffset={totalLength}
                polygonOffset={true}
                polygonOffsetFactor={-10}
                transparent={true}
            />
        </>
    )
}

export default ArcLine