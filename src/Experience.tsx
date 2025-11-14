import { OrbitControls, Stars } from '@react-three/drei'
import { Perf } from 'r3f-perf'
import PostProcessingComponent from './Environment/PostProcessing'

import * as THREE from 'three'
import { Suspense, useState } from 'react'
import Atmosphere from './Environment/Atmosphere'
import Earth from './objects/Earth/Earth'
import Missile from './objects/Missile'
import EarthPlaceholder from './objects/Earth/EarthPlaceholder'
import { randomPointOnSphere } from './utils/coordconvertions'






const radius = 1 // later to Zustand ?

// const source1 = new THREE.Vector3(0.21431884007046528, 0.5918442365614065, -0.7834620823242794)
// const target1 = new THREE.Vector3(0.704355292418356, 0.5227659587170155, -0.49053478413761004)





const Experience = () => {
    const [locationsPairs] = useState(() => Array.from({ length: 10 }, () => {
        const res = randomPointOnSphere(1)
        const res2 = randomPointOnSphere(1)
        return {
            loc1: new THREE.Vector3(res[0], res[1], res[2]),
            loc2: new THREE.Vector3(res2[0], res2[1], res2[2]),
        }
    }));




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
                {locationsPairs.map((locationsPair, index) => <Missile key={index + "locs"} source={locationsPair.loc1} target={locationsPair.loc2} />)}
            </Suspense>




            {/* {objects.map((spherical, index) => <LandObject scale={0.03} radius={radius} id={index} onDelete={deleteHandler} key={index + "obj"} long={spherical.long} lat={spherical.lat} />)} */}


        </>
    )
}
export default Experience