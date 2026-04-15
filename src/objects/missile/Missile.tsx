import { useMemo } from "react"
import ArcLine from "./ArcLine"
import * as THREE from 'three'
import { MissileType } from "../../types/global"


type MissileProps = {
    missileId: string
    source: THREE.Vector3
    target: THREE.Vector3
    radius: number
    instanceId: number
    instancedMeshRef: React.RefObject<THREE.InstancedMesh | null>
    missileType: MissileType
    speed: number
    gravity: number
    simulationSpeed: number
}

// Color mapping per missile type
const MISSILE_COLORS: Record<MissileType, [number, number, number]> = {
    [MissileType.LIGHT]:  [4.0, 3.2, 0.4],    // bright yellow
    [MissileType.MEDIUM]: [4.0, 1.6, 0.2],    // orange
    [MissileType.HEAVY]:  [4.0, 0.3, 0.15],   // red
}


const Missile: React.FC<MissileProps> = ({
    missileId,
    source,
    target,
    radius,
    instanceId,
    instancedMeshRef,
    missileType,
    speed,
    gravity,
    simulationSpeed,
}) => {
    const color = useMemo(() => MISSILE_COLORS[missileType], [missileType])

    return (
        <ArcLine
            missileId={missileId}
            instanceId={instanceId}
            instancedMeshRef={instancedMeshRef}
            source={source}
            target={target}
            radius={radius}
            simulationSpeed={simulationSpeed * 0.1 * 0.5}
            lineWidth={3}
            color={color}
            speed={speed}
            gravity={gravity}
            missileType={missileType}
        />
    )
}
export default Missile