import { useCallback, useMemo, useState } from "react"

import ArcLine from "../utils/ArcLine"
import * as THREE from 'three'
import SurfaceObject from "../SurfaceObject"
import { xyzToLatLon } from "../utils/coordconvertions"


type missileProps = {
    source: THREE.Vector3
    target: THREE.Vector3
}


// given velocity of missile I can calculate animationLength of the arc based on distance according to radius?
// the arc itself doesn't have to be accurate in it's path but the distance - time ratio will be

// TODO: radius and animationLength to arcLine are fixed at the moment

const Missile: React.FC<missileProps> = ({ source, target }) => {
    const [position, setPosition] = useState(source)
    const [didLand, setDidLand] = useState(false)

    const onPositionUpdateHandler = useCallback((position: THREE.Vector3) => setPosition(position), [])
    const onFinishUpdateHandler = useCallback(() => { setDidLand(true) }, [])

    const targetSphericalLocation = useMemo(() => {
        const { x, y, z } = target
        return xyzToLatLon(x, y, z, 1)
    }, [target])

    return (
        <>

            {didLand ?
                <SurfaceObject
                    lat={targetSphericalLocation.lat}
                    long={targetSphericalLocation.long}
                    radius={1}
                    id={Math.random()}
                    scale={0.01}

                />

                :
                <>
                    <mesh position={position}>
                        <boxGeometry args={[0.01, 0.01, 0.01]} />
                        <meshBasicMaterial />
                    </mesh>

                    <ArcLine
                        source={source}
                        target={target}
                        onPositionUpdate={onPositionUpdateHandler}
                        radius={1}
                        animationLength={10000}
                        lineWidth={2}
                        color={'coral'}
                        onFinishUpdate={onFinishUpdateHandler}
                    />
                </>
            }
        </>
    )
}
export default Missile