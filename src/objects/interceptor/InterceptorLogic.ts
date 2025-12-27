/**
 * IMPLEMENT LATER - Basicially our current simulation is "God View" - a missile decides it's fate.
 * The Defense System should not know the curve of the missile from start to finish, but only upon detection.
 * So we want each interceptor to act individually.
 * predictMissileImpact : can be used for Decision Making : stragitic interception point, Prioritaztion, etc...
 * 
 * Another cool thing - we can reverse ballistics to find the origin point (where they sent the missile from !)
 */




// 
export const scanForMissiles = () => {

}

/**
 * The following example shows how given 2 position points and velocity we can determine impact point
 * we need to change the way to calculate veloicty though as we dont want to use "total time" which is god mode view.
 * Frame A : detect the missile -> Frame B : detect new missile position.
 * Velocity = (Pos2 - Pos1) / (t2 - t1) but we can't use useFrame of three.js as it is like 1/60 of a sceond, too low
 * which will make the estimation weird, so wait a couple of frames.
 */

// Example given a curve :

// // DEBUGGING NEW ALGORITHM

//     // 1. Pick a point in time (e.g., 50% of the way)
//     const tSample = 0.1;

//     // 2. Pick a tiny step forward (e.g., 0.1% later)
//     const tStep = 0.001;
//     const tNext = tSample + tStep;

//     const p1 = new THREE.Vector3();
//     const p2 = new THREE.Vector3();
//     curve.getPoint(tSample, p1);
//     curve.getPoint(tNext, p2);

//     // 3. Calculate REAL velocity
//     // Velocity = Distance / Time
//     // We know the distance is (p2 - p1).
//     // But what is the time? It is NOT '1'. It is (0.1% * TotalFlightTime).

//     // Assuming your curve object has the 'phys' property from your first prompt:
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const totalFlightTime = (curve as any).phys.totalTime;

//     // If you don't have access to .phys here, you must pass totalTime into this function!
//     const timeDeltaSeconds = tStep * totalFlightTime;

//     const velocity = p2.clone().sub(p1).divideScalar(timeDeltaSeconds);

//     // Now predict
//     const finalPosPred = predictMissileImpact(p1, velocity, 2, 1); // Gravity 2, Radius 1

//     console.log("Predicted:", finalPosPred);
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     console.log("Actual Target:", (curve as any).targetPos); // Compare if available
//     // DEBUGGING END