import * as THREE from 'three'
import { Line } from '@react-three/drei'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber';
import { calculateMissileFate, type InterceptionResult } from './utils/calculateMissileFate';
import { useInterceptorsStore } from '../../store/InterceptorsStore';
import { PhysicsProjectileCurve } from './utils/physicsProjectileCurve';





// const missileGeometry = new THREE.BoxGeometry(1, 1, 2)
// const missileMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(7, 1, 1) })

const tempObject = new THREE.Object3D(); // helper for instance ref updates

// Define the props for our new component
type ArcLineProps = {
    source: THREE.Vector3
    target: THREE.Vector3
    radius: number
    simulationSpeed: number
    color?: THREE.ColorRepresentation | [number, number, number]
    lineWidth?: number
    onFinishAnimation: (fate: InterceptionResult) => void
    showTrajectory: boolean,
    detectRadius: number,
    instanceId: number;
    instancedMeshRef: React.RefObject<THREE.InstancedMesh | null>
    speed: number
    gravity: number
    type?: 0 | 1
}
type animState = {
    timer: number,
    fate: InterceptionResult

}


const ArcLine: React.FC<ArcLineProps> = ({
    source,
    target,
    simulationSpeed,
    color = 'white',
    lineWidth = 2,
    onFinishAnimation,
    showTrajectory,
    detectRadius,
    instanceId,
    instancedMeshRef,
    speed,
    gravity,
    type
}) => {
    const predictionLineRef = useRef(null)
    const progressLineRef = useRef(null)
    // const missileRef = useRef<THREE.Mesh>(null)

    // animation handling - avoid re renders of the lines
    const animState = useRef<animState>({
        timer: 0,
        fate: { hasIntercept: false } // default - overwrite if found one in useEffect
    });



    // 1. We now need the curve itself, not just the points
    const curve = useMemo(() => {
        return new PhysicsProjectileCurve(source, target, speed, gravity, type);
    }, [source, target, speed, gravity, type]);

    const points = useMemo(() => curve.getPoints(50), [curve]);
    const totalLength = useMemo(() => curve.getLength(), [curve]);
    const lengths = useMemo(() => curve.getLengths(50), [curve]) // array of 51 distances so [0] <=> t=0 , [50] <=> t=1

    // dashed pattern size (a small fraction of the total length)
    const dashSizeVal = useMemo(() => Math.max(totalLength * 0.02, 0.001), [totalLength]);
    const gapSizeVal = useMemo(() => Math.max(totalLength * 0.015, 0.01), [totalLength]);
    const interceptors = useInterceptorsStore(state => state.interceptors) // not performent - will reload every arc line when interceptors changes but it's fine for mostly static.


    // This effect just resets the timer if the line changes
    useEffect(() => {
        if (!curve) return
        const fate = calculateMissileFate(curve, interceptors, 100, detectRadius)

        animState.current = {
            timer: 0,
            fate: fate
        };
        if (progressLineRef.current) {
            // Start fully "empty" (dashed line invisible/waiting)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (progressLineRef.current as any).material.dashOffset = totalLength;
        }
    }, [curve, interceptors, detectRadius, predictionLineRef, totalLength]); // Resets if the curve path changes


    // handles all the animations
    useFrame((state, delta) => {
        void state
        const currState = animState.current;

        // 1. PHYSICS TIME LOGIC
        // The curve knows how long the flight physically takes (in seconds)
        const realFlightDuration = curve.totalTime;

        // Safety check: if calculation failed (target too far), stop
        if (realFlightDuration <= 0) return;

        // 2. UPDATE TIMER
        // We add delta (seconds) * speed factor
        // We do NOT use msDelta anymore because physics time is usually in seconds
        currState.timer += delta * simulationSpeed;

        if (!progressLineRef.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const progressLine = progressLineRef.current as any;
        const progressMat = progressLine.material;

        // --- Progress Logic ---
        if (currState.timer < realFlightDuration) {

            // Calculate 0..1 percentage based on Real Physics Time
            const progress = Math.min(currState.timer / realFlightDuration, 1.0);

            // update dash offset - approximate position according to progress in lengths array
            const sampleIndex = progress * 50;
            const lowerIndex = Math.floor(sampleIndex);
            const weight = sampleIndex - lowerIndex; // decimal part for interpolation
            const distLow = lengths[lowerIndex] ?? 0;
            const distHigh = lengths[lowerIndex + 1] ?? lengths[lengths.length - 1];
            // now interpolate
            const currentDistance = distLow + (distHigh - distLow) * weight;
            progressMat.dashOffset = totalLength - currentDistance;

            // -- update instance ref
            if (instancedMeshRef.current) {
                // .getPoint(t) of our physicsCurve – will be used to update missile position in real time
                const pos = curve.getPoint(progress);

                // .getTangent(t) works AUTOMATICALLY because we extended THREE.Curve!
                const tangent = curve.getTangent(progress);

                tempObject.position.copy(pos);
                tempObject.lookAt(pos.clone().add(tangent));

                // Ensure scale is correct (reset it if it was hidden previously)
                tempObject.scale.setScalar(0.01);

                tempObject.updateMatrix();
                instancedMeshRef.current.setMatrixAt(instanceId, tempObject.matrix);

                // CRITICAL: Three.js needs this flag to render the update
                instancedMeshRef.current.instanceMatrix.needsUpdate = true;
            }

            // --- Interception logic ----
            const fate = animState.current.fate;

            // Check if we passed the interception timestamp (t is 0..1)
            if (fate.t && progress >= fate.t) {
                // hide the mesh
                if (instancedMeshRef.current) {
                    tempObject.scale.set(0, 0, 0); // Hide
                    tempObject.updateMatrix();
                    instancedMeshRef.current.setMatrixAt(instanceId, tempObject.matrix);
                    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
                }

                // Stop animation
                currState.timer = realFlightDuration + 1;
                onFinishAnimation(fate);
            }

        } else if (currState.timer < realFlightDuration + delta * 5) {
            // Small buffer to ensure we hit the "else" block exactly once
            // --- Finished Logic ---
            onFinishAnimation(animState.current.fate);
            // Push timer way past end so we don't trigger this else block again
            currState.timer = realFlightDuration + 1000;
        }
    });


    return (
        <>

            {/* PREDICTION LINE*/}
            {showTrajectory &&
                <Line
                    ref={predictionLineRef}
                    points={points}
                    color={new THREE.Color(0.57 * 2, 0.44 * 2, 0.86 * 2)}
                    lineWidth={lineWidth / 2}
                    dashed={true}
                    dashSize={dashSizeVal}
                    gapSize={gapSizeVal}
                    dashOffset={0}
                    polygonOffset={true}
                    polygonOffsetFactor={-1} // In front of its border
                    transparent={true}
                />}
            {/* --- PROGRESS LINE --- */}
            <Line
                ref={progressLineRef}
                points={points}
                color={color as THREE.ColorRepresentation}
                lineWidth={lineWidth}
                dashed={true}
                dashSize={totalLength}
                gapSize={totalLength}
                dashOffset={totalLength}
                polygonOffset={true}
                polygonOffsetFactor={-10} // In front of everything
                transparent={true}
            />

        </>
    )
}

export default ArcLine;