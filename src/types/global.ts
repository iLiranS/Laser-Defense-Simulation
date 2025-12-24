import * as THREE from 'three'


export type cartesianCoords = THREE.Vector3

export type sphericalCoords = {
    lat: number,
    long: number,
    altitude?: number,
    radius?: number,
}
export type coords = cartesianCoords | sphericalCoords

