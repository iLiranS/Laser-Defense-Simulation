import { shaderMaterial, useTexture } from "@react-three/drei"
import type { sphereCoords } from "./types/global"
import earthVertexShader from './shaders/earth/vertex.glsl'
import earthFragmentShader from './shaders/earth/fragment.glsl'
import { extend } from "@react-three/fiber"
import * as THREE from 'three'
import { useRef } from "react"



type earthProps = {
    radius: number
    addObject: (coords: sphereCoords) => void
}

const earthParameters = {
    atmosphereDayColor: '#00aaff',
    atmosphereTwilightColor: '#ff6600'
}

const EarthMaterial = shaderMaterial(
    {
        uDayTexture: null,
        uSunDirection: new THREE.Vector3(0, 0, 1),
        uAtmosphereDayColor: new THREE.Color(earthParameters.atmosphereDayColor),
        uAtmosphereTwilightColor: new THREE.Color(earthParameters.atmosphereTwilightColor),
    },
    earthVertexShader,
    earthFragmentShader

)
extend({ EarthMaterial })

const Earth: React.FC<earthProps> = ({ radius, addObject }) => {

    const earthRef = useRef<THREE.Mesh | null>(null)
    const earthDayTexture = useTexture('./10k_map_min.jpg')
    earthDayTexture.colorSpace = THREE.SRGBColorSpace



    return (
        <mesh ref={earthRef} onClick={(e) => {
            e.stopPropagation();
            const clickPosition = e.point;
            const lat = Math.asin(clickPosition.y / radius);
            const long = Math.atan2(clickPosition.z, clickPosition.x);
            addObject({ lat, long })

        }} castShadow>
            <sphereGeometry args={[radius, 64, 64]} />
            {/* pass texture as prop (Option A) */}
            <earthMaterial uDayTexture={earthDayTexture} />
        </mesh>
    )
}
export default Earth