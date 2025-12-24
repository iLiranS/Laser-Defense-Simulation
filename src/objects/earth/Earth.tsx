import { shaderMaterial, useTexture } from "@react-three/drei"
import type { coords } from "../../types/global"
import earthVertexShader from '../../shaders/earth/vertex.glsl'
import earthFragmentShader from '../../shaders/earth/fragment.glsl'
import { extend } from "@react-three/fiber"
import * as THREE from 'three'
import { useRef } from "react"
import { useGameManagerStore } from "../../store/gameManagerStore"
import EarthLines from "./EarthLines"



type earthProps = {
    addObject?: (coords: coords) => void
}

const earthParameters = {
    atmosphereDayColor: '#00aaff',
    atmosphereTwilightColor: '#ff6600'
}

const EarthMaterial = shaderMaterial(
    {
        uDayTexture: null,
        uBordersTexture: null,
        uSunDirection: new THREE.Vector3(0, 0, 1),
        uAtmosphereDayColor: new THREE.Color(earthParameters.atmosphereDayColor),
        uAtmosphereTwilightColor: new THREE.Color(earthParameters.atmosphereTwilightColor),
    },
    earthVertexShader,
    earthFragmentShader

)
extend({ EarthMaterial })

const Earth: React.FC<earthProps> = ({ addObject }) => {

    const earthRef = useRef<THREE.Mesh | null>(null)
    const earthDayTexture = useTexture('./nasa_texture.jpg')
    earthDayTexture.colorSpace = THREE.SRGBColorSpace
    const radius = useGameManagerStore(state => state.radius)





    return (
        <group>
            <mesh ref={earthRef} onClick={(e) => {
                e.stopPropagation();
                if (!addObject) return
                const clickPosition = e.point;
                const lat = Math.asin(clickPosition.y / radius);
                const long = Math.atan2(clickPosition.z, clickPosition.x);
                addObject({ lat, long })

            }} castShadow>
                <sphereGeometry args={[radius, 64, 64]} />
                {/* pass texture as prop (Option A) */}
                <earthMaterial
                    uDayTexture={earthDayTexture}
                />
            </mesh>
            <EarthLines scale={radius * 1.01} />
        </group>

    )
}
export default Earth