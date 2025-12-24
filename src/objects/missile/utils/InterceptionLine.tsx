import { Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

type interceptionLineProps = {
    interceptionPoint: THREE.Vector3
    interceptorPos: THREE.Vector3
    onFinishAnimation: () => void
}

const InterceptionLine: React.FC<interceptionLineProps> = ({ interceptionPoint, interceptorPos, onFinishAnimation }) => {
    // Cast as 'any' to avoid needing specific type definitions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lineRef = useRef<any>(null)
    const opacityVal = useRef(1)

    useFrame((state, delta) => {
        void state
        if (!lineRef.current) return

        // Speed up the fade as it gets closer to 0
        const decaySpeed = 0.5 + (1 - opacityVal.current) * 2.0
        opacityVal.current -= delta * decaySpeed

        // Access material directly
        if (lineRef.current.material) {
            lineRef.current.material.opacity = opacityVal.current
            // Drei's Line material sometimes needs this flag to update uniforms
            lineRef.current.material.needsUpdate = true
        }

        if (opacityVal.current <= 0) {
            opacityVal.current = 0
            onFinishAnimation()
        }
    })

    return (
        <Line
            ref={lineRef}
            points={[interceptorPos, interceptionPoint]}
            color={new THREE.Color(0.1, 3, 0.1)}
            transparent={true}
            lineWidth={2}
            opacity={1}
        />
    )
}
export default InterceptionLine