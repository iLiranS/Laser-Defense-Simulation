import vertexShader from '../shaders/atmosphere/vertex.glsl'
import fragmentShader from '../shaders/atmosphere/fragment.glsl'
import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { extend } from "@react-three/fiber";
import { useGameManagerStore } from '../store/gameManagerStore';


const earthParameters = {
    atmosphereDayColor: '#00aaff',
    atmosphereTwilightColor: '#ff6600'
}
const AtmosphereMaterial = shaderMaterial(
    {
        uAtmosphereDayColor: new THREE.Color(earthParameters.atmosphereDayColor),
        uAtmosphereTwilightColor: new THREE.Color(earthParameters.atmosphereTwilightColor),

    },
    vertexShader,
    fragmentShader,

)
extend({ AtmosphereMaterial })

// we will 
const Atmosphere = () => {
    const radius = useGameManagerStore(state => state.radius)
    return (
        <mesh>
            <sphereGeometry args={[radius * 1.03, 64, 64]} />
            <atmosphereMaterial
                side={THREE.BackSide}
                transparent
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </mesh>
    )
}
export default Atmosphere