import { OrbitControls, Stars } from '@react-three/drei'
import { Perf } from 'r3f-perf'
import PostProcessingComponent from './Environment/PostProcessing'

import * as THREE from 'three'
import { Suspense } from 'react'
import Atmosphere from './Environment/Atmosphere'
import Earth from './objects/Earth/Earth'
import Missile from './objects/Missile'
import EarthPlaceholder from './objects/Earth/EarthPlaceholder'






const radius = 1 // later to Zustand ?
const source4 = new THREE.Vector3(0.21431884007046528, 0.5918442365614065, -0.7834620823242794)
const target4 = new THREE.Vector3(0.704355292418356, 0.5227659587170155, -0.49053478413761004)


const Experience = () => {


    return (
        <>
            {/* Environment related */}
            <color args={['#0E0E0F']} attach='background' />
            {/* <Environment preset='city' /> */}
            <Perf position='top-left' />
            <OrbitControls makeDefault />
            <Stars radius={10} depth={50} count={1000} factor={2} saturation={0} fade speed={0.25} />
            <PostProcessingComponent />

            <Suspense fallback={<EarthPlaceholder radius={radius} />}>
                <Atmosphere radius={radius * 1.03} />
                <Earth radius={radius} />
            </Suspense>

            <Missile source={source4} target={target4} />



            {/* {objects.map((spherical, index) => <LandObject scale={0.03} radius={radius} id={index} onDelete={deleteHandler} key={index + "obj"} long={spherical.long} lat={spherical.lat} />)} */}


        </>
    )
}
export default Experience