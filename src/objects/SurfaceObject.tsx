import type React from "react"
import * as THREE from 'three'
import { sphericalToCartesian } from "../utils/coordconvertions"
import { useRef } from "react"

type surfaceObjectProps = {
    lat: number,
    long: number,
    altitude?: number,
    radius?: number,
    id: number,
    onDelete?: (id: number) => void
    scale?: number
}

// TODO: make optional mesh as props - defaults to cube


const SurfaceObject: React.FC<surfaceObjectProps> = (
    { lat, long, altitude = 0, radius = 1, id, onDelete, scale }) => {
    // by default the object will be place on the sphere land and face up
    const objRef = useRef(null)



    // position
    const meshScale = scale ?? 0.05
    const { x, y, z } = sphericalToCartesian(lat, long, radius, altitude, meshScale)


    // rotation
    const pos = new THREE.Vector3(x, y, z);
    const newUp = pos.clone().normalize();
    const defaultUp = new THREE.Vector3(0, 1, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(defaultUp, newUp);

    // delete handler
    const deleteObjectHandler = () => {
        if (onDelete)
            onDelete(id)
    }

    return (
        <>
            <mesh ref={objRef} onContextMenu={(e) => { e.stopPropagation(); deleteObjectHandler() }}
                position={[x, y, z]}
                quaternion={q}
            >
                <boxGeometry args={[meshScale, meshScale, meshScale]} />
                <meshBasicMaterial color={[1 * 7, 0.05 * 7, 0.05 * 7]} />
            </mesh>
        </>
    )
}
export default SurfaceObject