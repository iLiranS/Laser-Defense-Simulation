import { Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

type LaserBeamProps = {
    interceptorPos: THREE.Vector3
    targetPos: THREE.Vector3
    dwellProgress: number  // 0..1 how much dwell time has been applied
}

/**
 * Persistent laser beam from interceptor to target.
 * Shown continuously while an interceptor is ENGAGING a missile.
 * Pulses in intensity based on dwell progress.
 */
const LaserBeam: React.FC<LaserBeamProps> = ({ interceptorPos, targetPos, dwellProgress }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lineRef = useRef<any>(null)
    const pulsePhase = useRef(0)

    useFrame((_state, delta) => {
        if (!lineRef.current?.material) return

        pulsePhase.current += delta * 8
        const pulse = 0.7 + 0.3 * Math.sin(pulsePhase.current)
        const intensityBoost = 1 + dwellProgress * 2

        lineRef.current.material.opacity = pulse * Math.min(1, 0.5 + dwellProgress)
        lineRef.current.material.linewidth = 1 + dwellProgress * 2

        // Color shifts from green to white as dwell progresses (heating up)
        const r = 0.1 + dwellProgress * 0.9
        const g = 1.0 * intensityBoost
        const b = 0.1 + dwellProgress * 0.5
        lineRef.current.material.color.setRGB(r, g, b)
        lineRef.current.material.needsUpdate = true
    })

    return (
        <Line
            ref={lineRef}
            points={[interceptorPos, targetPos]}
            color={new THREE.Color(0.1, 3, 0.1)}
            transparent={true}
            lineWidth={2}
            opacity={0.8}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
        />
    )
}
export default LaserBeam
