import { OrbitControls, Stars, useTexture } from '@react-three/drei'
import { Perf } from 'r3f-perf'
import PostProcessingComponent from './Environment/PostProcessing'

import LandObject from './SurfaceObject'
import * as THREE from 'three'
// import { useControls } from 'leva'
import { useState } from 'react'

import ArcLine from './utils/ArcLine'
import { xyzToLatLon } from './utils/coordconvertions'
import Atmosphere from './Environment/Atmosphere'



// import * as THREE from 'three'
// import SphereParticles from './SphereParticles'

type sphereCoords = { long: number, lat: number }
const radius = 1

/**
 * LINE RELATED
 */

// 1. Define your main parameters


const source = new THREE.Vector3(0.71138857145504, 0.07257719356027177, 0.699041380304537);
const target = new THREE.Vector3(0.3277289655950536, -0.16308898392387985, -0.9305889040992659);
const source1Coords = xyzToLatLon(source.x, source.y, source.z, 1)
const target1Coords = xyzToLatLon(target.x, target.y, target.z, 1)


const source2 = new THREE.Vector3(-0.124095712556177, -0.9798310273706684, -0.15662506800290638);
const target2 = new THREE.Vector3(-0.09300667299949929, 0.9906993409470974, 0.09932056496290681);
const source2Coords = xyzToLatLon(source2.x, source2.y, source2.z, 1)
const target2Coords = xyzToLatLon(target2.x, target2.y, target2.z, 1)

const source3 = new THREE.Vector3(0.8931182787217542, -0.41350376255807714, -0.1770716763443674)
const target3 = new THREE.Vector3(-0.9687815626736365, -0.11976923262679033, 0.21706592256643342)
const source3Coords = xyzToLatLon(source3.x, source3.y, source3.z, 1)
const target3Coords = xyzToLatLon(target3.x, target3.y, target3.z, 1)


const source4 = new THREE.Vector3(0.21431884007046528, 0.5918442365614065, -0.7834620823242794)
const target4 = new THREE.Vector3(0.704355292418356, 0.5227659587170155, -0.49053478413761004)


const Experience = () => {
    // type the ref so null is allowed
    const [objects, setObjects] = useState<sphereCoords[]>([source1Coords, target1Coords, source2Coords, target2Coords, source3Coords, target3Coords])
    const countriesMap = useTexture('./10k_map_min.jpg')
    // const { long, lat, altitude, radius } = useControls({
    //     long: {
    //         value: 0,
    //         step: 0.001,
    //         min: -1 * Math.PI * 2,
    //         max: Math.PI * 2
    //     },
    //     lat: {
    //         value: 0,
    //         step: 0.001,
    //         min: -Math.PI * 0.5,
    //         max: Math.PI * 0.5
    //     },
    //     altitude: { value: 0, min: 0, max: 5 },
    //     radius: { value: 1, min: 1, max: 5 }
    // })

    const deleteHandler = (index: number) => {
        setObjects(prev => {
            return prev.filter((_, i) => i !== index)
        })
    }

    return (
        <>
            {/* Environment related */}
            <color args={['#0E0E0F']} attach='background' />
            {/* <Environment preset='city' /> */}
            <Perf position='top-left' />
            <OrbitControls makeDefault />
            <Stars radius={10} depth={50} count={1000} factor={2} saturation={0} fade speed={0.25} />
            <Atmosphere radius={radius * 1.04} />
            <PostProcessingComponent />



            <mesh onClick={(e) => {
                e.stopPropagation();
                const clickPosition = e.point;
                const lat = Math.asin(clickPosition.y / radius);
                const long = Math.atan2(clickPosition.z, clickPosition.x);
                console.log(lat, long)
                setObjects(prev => [...prev, { lat, long }]);

            }} castShadow>
                <sphereGeometry args={[radius, 128, 64]} />
                <meshBasicMaterial map={countriesMap} color={[1, 1, 1]} toneMapped={false} />
            </mesh>

            <ArcLine
                source={source}
                target={target}
                radius={radius}
                color={[0.8 * 5, 0.2 * 5, 0.2 * 5]}
                lineWidth={2}
                animationLength={3000}
            />
            <ArcLine
                source={source2}
                target={target2}
                radius={radius}
                color={[0.8 * 5, 0.2 * 5, 0.2 * 5]}
                lineWidth={2}
                animationLength={10000}
            />
            <ArcLine
                source={source3}
                target={target3}
                radius={radius}
                color={[0.8 * 5, 0.2 * 5, 0.2 * 5]}
                lineWidth={2}
                animationLength={5000}
            />
            <ArcLine
                source={source4}
                target={target4}
                radius={radius}
                color={[0.8 * 5, 0.2 * 5, 0.2 * 5]}
                lineWidth={2}
                animationLength={5000}
            />



            {objects.map((spherical, index) => <LandObject scale={0.03} radius={radius} id={index} onDelete={deleteHandler} key={index + "obj"} long={spherical.long} lat={spherical.lat} />)}


        </>
    )
}
export default Experience