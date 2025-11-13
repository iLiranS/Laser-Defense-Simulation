import { useRef, useMemo } from "react";
import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import * as THREE from "three";
import vertexShader from './shaders/test_dot/vertex.glsl'
import fragmentShader from './shaders/test_dot/fragment.glsl'

const count = 10000

// Rename to PascalCase
const SphereMaterial = shaderMaterial(
    {
        uTime: 0,
    },
    vertexShader,
    fragmentShader,
)
// Extend with PascalCase name
extend({ SphereMaterial })

const SphereParticles = () => {
    const points = useRef(null);
    const materialRef = useRef(null);


    // useFrame((state) => {
    //     if (materialRef.current) {
    //         materialRef.current.uTime = state.clock.elapsedTime
    //     }
    // })

    const particlesPosition = useMemo(() => {
        const positions = new Float32Array(count * 3);

        const distance = 1; // radius

        for (let i = 0; i < count; i++) {
            const theta = THREE.MathUtils.randFloatSpread(360);
            const phi = THREE.MathUtils.randFloatSpread(360);

            const x = distance * Math.sin(theta) * Math.cos(phi)
            const y = distance * Math.sin(theta) * Math.sin(phi);
            const z = distance * Math.cos(theta);

            positions.set([x, y, z], i * 3);
        }
        return positions;
    }, []);

    return (
        <points ref={points}>
            <bufferGeometry>
                <bufferAttribute
                    args={[particlesPosition, 3]}
                    attach="attributes-position"
                />
            </bufferGeometry>

            <sphereMaterial ref={materialRef} />
        </points>
    );
};

export default SphereParticles