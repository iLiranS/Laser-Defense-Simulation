import { OrbitControls, Stars } from '@react-three/drei'
import { Perf } from 'r3f-perf'
import PostProcessingComponent from './environment/PostProcessing'

import { Suspense } from 'react'
import Atmosphere from './environment/Atmosphere'
import Earth from './objects/earth/Earth'

import EarthPlaceholder from './objects/earth/EarthPlaceholder'
import InterceptorsManager from './objects/interceptor/InterceptorsManager'
import { useGameManagerStore } from './store/gameManagerStore'
import MissileManager from './objects/missile/MissileManager'
import Debug from './debug/Debug'
import SimulationController from './simulation/SimulationController'
import CityMarkers from './objects/earth/CityMarkers'


// const target1 = new THREE.Vector3(0.704355292418356, 0.5227659587170155, -0.49053478413761004) // israel radius 1




const Experience = () => {
    const radius = useGameManagerStore(s => s.radius)


    return (
        <>
            {/* Environment related */}
            <color args={['#0E0E0F']} attach='background' />
            {/* <Environment preset='city' /> */}
            <Perf position='top-left' />
            <OrbitControls makeDefault
                rotateSpeed={0.5} dampingFactor={0.1}

                // enablePan={false}
                maxDistance={radius * 10} minDistance={radius * 1.2} />
            <Stars radius={10} depth={50} count={1000} factor={2} saturation={0} fade speed={0.25} />
            <PostProcessingComponent />
            <Debug />



            <Suspense fallback={<EarthPlaceholder radius={radius} />}>
                <Atmosphere />
                <Earth />
                <CityMarkers />
                <MissileManager />
                <InterceptorsManager />
                <SimulationController />
            </Suspense>



        </>
    )
}
export default Experience