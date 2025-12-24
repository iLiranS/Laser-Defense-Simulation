import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import * as THREE from 'three'

type EarthPlaceholderProps = {
    radius: number
}

const EarthPlaceholder: React.FC<EarthPlaceholderProps> = ({ radius }) => {
    const earthPlaceholderRef = useRef<THREE.Mesh>(null)

    useFrame((state, delta) => {
        void state // ts warning handling of 'state' unused
        if (earthPlaceholderRef.current) {
            earthPlaceholderRef.current.rotation.y += delta * 0.2
            earthPlaceholderRef.current.rotation.x -= delta * 0.2
        }
    })

    return (
        <mesh ref={earthPlaceholderRef}>
            <sphereGeometry args={[radius, 32, 16]} />
            <meshBasicMaterial wireframe />
        </mesh>
    )
}
export default EarthPlaceholder