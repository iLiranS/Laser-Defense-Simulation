import vertexShader from '../shaders/atmosphere/vertex.glsl'
import fragmentShader from '../shaders/atmosphere/fragment.glsl'
import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { extend } from "@react-three/fiber";


const earthParameters = {
    atmosphereDayColor: '#00aaff',
    atmosphereTwilightColor: '#ff6600'
}

type atmosphereProps = {
    radius: number
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
const Atmosphere: React.FC<atmosphereProps> = ({ radius }) => {
    return (
        <mesh>
            <sphereGeometry args={[radius, 64, 64]} />
            <atmosphereMaterial
                transparent
                side={THREE.BackSide}
            />
        </mesh>
    )
}
export default Atmosphere