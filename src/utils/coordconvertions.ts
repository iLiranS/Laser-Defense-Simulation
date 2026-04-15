import * as THREE from 'three'
import type { cartesianCoords, sphericalCoords } from "../types/global"



export const sphericalToCartesian = (coords: sphericalCoords): cartesianCoords => {
    const { radius = 1, altitude = 0, lat, long } = coords
    // Synchronizing with EarthLines.tsx logic:
    // Longitude is negated to match how the NASA texture and GeoJSON borders are mapped.
    const adjustedLong = -long
    
    const xPos = (radius + altitude) * Math.cos(lat) * Math.cos(adjustedLong)
    const zPos = (radius + altitude) * Math.cos(lat) * Math.sin(adjustedLong)
    const yPos = (radius + altitude) * Math.sin(lat)
    return new THREE.Vector3(xPos, yPos, zPos)
}

export function cartesianToSpherical(pos: cartesianCoords, radius = 1): sphericalCoords {
    const { x, y, z } = pos;

    // 1. Calculate the total length (total radius) of the vector
    const totalRadius = Math.sqrt(x * x + y * y + z * z);

    // 2. Calculate altitude based on the provided base radius
    const altitude = totalRadius - radius;

    // 3. Normalize the coordinates to get lat/long
    //    We must divide by totalRadius to get a unit vector for trig
    const nx = x / totalRadius;
    const ny = y / totalRadius;
    const nz = z / totalRadius;

    // 4. Compute latitude (φ) and longitude (λ)
    const lat = Math.asin(ny);      // radians
    // Inverse of sphericalToCartesian where adjustedLong was -long
    const long = -Math.atan2(nz, nx); // radians

    // 5. Return the correct components
    return {
        lat,
        long,
        altitude, // The calculated altitude
        radius    // The base radius that was used for the calculation
    };
}

export function randomPointOnSphere(radius: number): [number, number, number] {
    // random angles
    const u = Math.random();
    const v = Math.random();

    const theta = 2 * Math.PI * u;         // azimuth
    const phi = Math.acos(2 * v - 1);      // polar

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    return [x, y, z];
}

