
export const sphericalToCartesian = (lat: number, long: number, radius = 1, altitude = 0, meshHeight = 1) => {
    const xPos = (radius + altitude + meshHeight / 2) * Math.cos(lat) * Math.cos(long)
    const zPos = (radius + altitude + meshHeight / 2) * Math.cos(lat) * Math.sin(long)
    const yPos = (radius + altitude + meshHeight / 2) * Math.sin(lat)
    return { x: xPos, y: yPos, z: zPos }
}

export function xyzToLatLon(x: number, y: number, z: number, radius = 1) {
    // Normalize if radius isn't 1
    const nx = x / radius;
    const ny = y / radius;
    const nz = z / radius;

    // Compute latitude (φ) and longitude (λ)
    const lat = Math.asin(ny);              // radians
    const long = Math.atan2(nz, nx);         // radians

    // Return both radians and degrees for convenience
    return {
        lat,                                 // radians
        long,                                 // radians
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

// example
const [num1, num2, num3] = randomPointOnSphere(1);
console.log(num1, num2, num3);
