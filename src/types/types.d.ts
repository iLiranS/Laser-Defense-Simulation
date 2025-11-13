// R3F has some type problems like extending a shader material so they are needed to be declared.

import { ShaderMaterialProps } from "@react-three/fiber";
import * as THREE from 'three'


declare module "@react-three/fiber" {
    interface ThreeElements {
        /**
         * Note: The key MUST be camelCase, matching your JSX tag <sphereMaterial />
         * It connects your `SphereMaterial` constructor to the JSX tag.
         */
        sphereMaterial: ShaderMaterialProps & {
            // Define your custom uniforms as optional props
            uTime?: number;
        };

        atmosphereMaterial: ShaderMaterialProps & {
            uAtmosphereDayColor: THREE.Color,
            uAtmosphereTwilightColor: THREE.Color,
            uSunDirection: THREE.Vector3
        }
    }
}
