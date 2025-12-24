import * as THREE from 'three';

// here we will calculate velocity along surface, relative to surface, horizontal distane
export function calculateProjectileData(startPos: THREE.Vector3, targetPos: THREE.Vector3, speed: number, gravity: number, missileType?: 0 | 1) {
    const radius = startPos.length(); // getting the sphere radius according to position length - it would be 1 in our case.


    // 1. Calculate Distance along the curvature (Arc Length)
    // The angle between the two vectors * radius = length of the arc
    const angle = startPos.angleTo(targetPos); // angle from sphere center between start and target
    const distH = angle * radius; // "Horizontal" distance wrapped around earth - radius usually 1 so = angle

    // 2. Physics logic

    // sin(2*theta) = (R * g) / v^2  ==> we know that from Range (R) formula
    const argument = (distH * gravity) / (speed * speed);

    if (argument > 1) {
        console.warn("Target out of range for this speed");
        return null;
    }

    let theta = 0.5 * Math.asin(argument);

    // for fun - mortar trajectory - we have two valid angles
    if (missileType) {
        theta = (Math.PI / 2) - (0.5 * Math.asin(argument));
    }

    const v_y = speed * Math.sin(theta);  // Vertical velocity 
    const v_x = speed * Math.cos(theta); // Horizontal velocity 
    const totalTime = (2 * v_y) / gravity;

    return { v_x, v_y, totalTime, distH, radius };
}