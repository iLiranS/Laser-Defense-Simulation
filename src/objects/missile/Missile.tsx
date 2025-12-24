import { useCallback, useEffect, useState } from "react"

import ArcLine from "./ArcLine"
import * as THREE from 'three'
import type { InterceptionResult } from "./utils/calculateMissileFate"
import InterceptionLine from "./utils/InterceptionLine"
import { useGameManagerStore } from "../../store/gameManagerStore"



type missileProps = {
    source: THREE.Vector3
    target: THREE.Vector3
    radius: number
    id: number
    instancedMeshRef: React.RefObject<THREE.InstancedMesh | null>
}




const Missile: React.FC<missileProps> = ({ source, target, radius, id, instancedMeshRef }) => {

    const [interceptionResult, setInterceptionResult] = useState<InterceptionResult>()
    const [finishedAnimation, setFinishedanimation] = useState(false)
    const [showInterception, setShowInterception] = useState(false)
    const { simulationSpeed, showTrajectoryPrediction, detectRadius, missileSpeed, gravity } = useGameManagerStore() // reset on every game change but its fine.






    const onFinishAnimationHandler = useCallback((res: InterceptionResult) => {
        setFinishedanimation(true)
        setInterceptionResult(res)
        if (res.hasIntercept) setShowInterception(true)
    }, [])

    const onFinishInterceptionAnimationHandler = useCallback(() => { setShowInterception(false) }, [])

    // reset the whole simulation upon speed change
    useEffect(() => {
        setFinishedanimation(false)
        setShowInterception(false)

    }, [simulationSpeed])

    return (
        <>


            {!finishedAnimation &&
                <ArcLine
                    instanceId={id}
                    instancedMeshRef={instancedMeshRef}
                    key={simulationSpeed}
                    source={source}
                    target={target}
                    radius={radius}
                    simulationSpeed={simulationSpeed * 0.1 * 0.5}
                    lineWidth={3}
                    color={[1 * 4, 0.2 * 4, 0.1 * 4]}
                    onFinishAnimation={onFinishAnimationHandler}
                    showTrajectory={showTrajectoryPrediction}
                    detectRadius={detectRadius}
                    speed={missileSpeed}
                    gravity={gravity}
                />
            }
            {interceptionResult && showInterception &&
                <InterceptionLine
                    interceptionPoint={interceptionResult.point as THREE.Vector3}
                    interceptorPos={interceptionResult.interceptorPos as THREE.Vector3}
                    onFinishAnimation={onFinishInterceptionAnimationHandler}
                />
            }

        </>
    )
}
export default Missile