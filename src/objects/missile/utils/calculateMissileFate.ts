import * as THREE from 'three'




export type InterceptionResult = {
    hasIntercept: boolean;
    interceptorPos?: THREE.Vector3;
    point?: THREE.Vector3;
    t?: number; // The time (0-1) along the curve where hits happen
}
/**
 * Calculates if and where a missile is intercepted.
 * Strategy: Samples the Bezier curve from start to finish.
 * Returns the FIRST interceptor encountered.
 */
export function calculateMissileFate(
    curve: THREE.Curve<THREE.Vector3>,
    interceptors: THREE.Vector3[],
    samples: number = 100, //  will affect preformance - lower the better !
    detectRadius: number
): InterceptionResult {

    // Optimization: Create a scratch vector to avoid garbage collection
    const currentPoint = new THREE.Vector3();




    // 1. Iterate through the curve from Source (t=0) to Target (t=1)
    // let's detect from t=0.05 up to t=0.95 to avoid "too early" and "too late" to detection
    for (let i = samples / 20; i <= samples / 20 * 19; i++) {
        const t = i / samples;
        curve.getPoint(t, currentPoint); // will set currentPoint to be the position of the missile in 't' percent

        // given point in each sample we can check if it lands inside interceptor radius
        for (const interceptor of interceptors) {
            const distSq = currentPoint.distanceToSquared(interceptor);
            const radiusSq = detectRadius * detectRadius;

            if (distSq <= radiusSq) {
                return {
                    hasIntercept: true,
                    interceptorPos: interceptor,
                    point: currentPoint.clone(),
                    t: t
                };
            }
        }
    }
    return { hasIntercept: false };
}

