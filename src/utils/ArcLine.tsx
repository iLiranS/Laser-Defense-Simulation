import * as THREE from 'three'
import { Line } from '@react-three/drei'
import { useEffect, useMemo, useState } from 'react'


// A helper vector for calculations
const UP_VECTOR = new THREE.Vector3(0, 1, 0);
const fps = 30

// Define the props for our new component
type ArcLineProps = {
    source: THREE.Vector3
    target: THREE.Vector3
    radius: number
    animationLength: number
    color?: THREE.ColorRepresentation | [number, number, number]
    lineWidth?: number
    onPositionUpdate: (position: THREE.Vector3) => void
    onFinishUpdate: () => void
}

const ArcLine: React.FC<ArcLineProps> = ({
    source,
    target,
    radius,
    animationLength,
    color = 'white',
    lineWidth = 2,
    onPositionUpdate,
    onFinishUpdate
}) => {
    const [timer, setTimer] = useState(0)



    // 1. We now need the curve itself, not just the points
    const curve = useMemo(() => {
        // --- 1. Get the directions (normalized)
        const sourceNorm = source.clone().normalize();
        const targetNorm = target.clone().normalize();

        // --- 2. Create the actual start and end points on the sphere
        const P0_start = sourceNorm.clone().multiplyScalar(radius);
        const P3_end = targetNorm.clone().multiplyScalar(radius);

        // --- 3. Calculate arcHeight based on the new points
        // This ensures the bulge is proportional to the sphere's size
        const arcHeight = P0_start.distanceTo(P3_end) * 0.4 + radius;

        // --- 4. Quaternion logic 
        const totalRotation = new THREE.Quaternion();

        if (sourceNorm.dot(targetNorm) < -0.999) {
            const perpendicularAxis = UP_VECTOR.clone().cross(sourceNorm).normalize();
            if (perpendicularAxis.lengthSq() === 0) {
                perpendicularAxis.set(1, 0, 0).cross(sourceNorm).normalize();
            }
            totalRotation.setFromAxisAngle(perpendicularAxis, Math.PI);
        } else {
            totalRotation.setFromUnitVectors(sourceNorm, targetNorm);
        }

        const identity = new THREE.Quaternion();
        const q_25 = identity.clone().slerp(totalRotation, 0.25);
        const q_75 = identity.clone().slerp(totalRotation, 0.75);

        // --- 5. Get control point directions
        const control1Dir = sourceNorm.clone().applyQuaternion(q_25);
        const control2Dir = sourceNorm.clone().applyQuaternion(q_75);

        // --- 6. Scale control points by the new arcHeight
        const controlXYZ1 = control1Dir.multiplyScalar(arcHeight);
        const controlXYZ2 = control2Dir.multiplyScalar(arcHeight);

        // --- 7. Return the curve using the scaled start and end points
        return new THREE.CubicBezierCurve3(
            P0_start,
            controlXYZ1,
            controlXYZ2,
            P3_end
        );
    }, [source, target, radius]);


    const points = useMemo(() => curve.getPoints(50), [curve]);
    const totalLength = useMemo(() => curve.getLength(), [curve]);
    const progress = timer / animationLength


    useEffect(() => {
        if (timer >= animationLength) {
            onFinishUpdate()
            return
        }

        const interval = setInterval(() => {
            onPositionUpdate(curve.getPoint(timer / animationLength))
            setTimer(prev => {
                const newTimer = prev + (1000 / fps)
                return newTimer < animationLength ? newTimer : animationLength
            })
        }, 1000 / fps)

        return () => clearInterval(interval)
    }, [animationLength, timer, curve, onPositionUpdate, onFinishUpdate])

    return (
        <>
            <Line
                points={points}
                color={color as THREE.ColorRepresentation}
                lineWidth={lineWidth}
                dashed={true}
                dashSize={totalLength}   // Dash is the total length
                gapSize={totalLength}    // Gap is the total length
                dashOffset={totalLength * (1 - progress)}
            />

        </>
    )
}

export default ArcLine;