import * as THREE from 'three';

/**
 * Predicts impact position and TTI (time to impact) given detection position and velocity.
 * NOTE : it's 3D space so we find the rotation axis using cross product and rotate the position vector.
 */
export interface ImpactPrediction {
    impactPosition: THREE.Vector3;
    timeToImpact: number; // in seconds
}

export function predictMissileImpact(
    detectedPos: THREE.Vector3,
    detectedVel: THREE.Vector3,
    gravity: number = 2,
    planetRadius: number = 1
): ImpactPrediction | null {

    // 1. some environmental context
    const distFromCenter = detectedPos.length();
    const currentHeight = distFromCenter - planetRadius;
    // If it's already on the ground (or below), return current position, nothing to work with.
    if (currentHeight <= 0.001) return { impactPosition: detectedPos.clone(), timeToImpact: 0 };

    // 2. Find the 3D velocity - x,y into x,y,z using "up direction"

    // The "Up" direction is simply the direction from center to current position
    const upDir = detectedPos.clone().normalize();
    // 2.1 FIND v_y (Vertical Speed)
    // We project the Velocity vector onto the Up vector (Dot Product).
    // If result is positive, it's flying up. If negative, it's falling.
    const current_v_y = detectedVel.dot(upDir);

    // 2.2 FIND v_x (Horizontal Speed)
    // We remove the vertical component from the total velocity. What's left is horizontal.
    // Vector_Horizontal = Velocity - (v_y * UpDir)
    const velocityVerticalVector = upDir.clone().multiplyScalar(current_v_y);
    const velocityHorizontalVector = detectedVel.clone().sub(velocityVerticalVector);
    const current_v_x = velocityHorizontalVector.length();

    // 3. Solve the Time to impact (Quadratic Formula) ---
    // We want to know when Height = 0. (landing = height of 0)
    // Equation: 0 = CurrentHeight + (v_y * t) - (0.5 * g * t^2)
    const a = 0.5 * gravity;
    const b = -current_v_y;       // Note the sign flip for standard quadratic form
    const c = -currentHeight;     // Note the sign flip

    const discriminant = (b * b) - (4 * a * c);

    // if the discriminant is negative, the object will never land (safety check)
    if (discriminant < 0) {
        console.warn("Object will never land (escaping orbit?)");
        return null;
    }

    // Solves for t. We want the larger result (the future impact).
    const t = (-b + Math.sqrt(discriminant)) / (2 * a);


    // 4. Calculate Impact Location

    // We know how long it flies (t) and how fast it moves sideways (v_x).
    // Arc Length = Speed * Time
    const distanceToTravel = current_v_x * t;

    // Convert distance to Angle (in radians)
    // Angle = ArcLength / Radius
    const angleToTravel = distanceToTravel / planetRadius;

    // We need an Axis to rotate around. 
    // The axis is perpendicular to both Position and Velocity (Cross Product).
    const rotationAxis = new THREE.Vector3()
        .crossVectors(detectedPos, detectedVel)
        .normalize();

    // Create the final position by rotating the CURRENT position
    const finalPos = detectedPos.clone()
        .applyAxisAngle(rotationAxis, angleToTravel) // Rotate along the path
        .setLength(planetRadius); // Snap to surface

    return { impactPosition: finalPos, timeToImpact: t };
}
