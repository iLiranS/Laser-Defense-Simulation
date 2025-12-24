import * as THREE from 'three';
import { calculateProjectileData } from './calculateProjectileData';

export class PhysicsProjectileCurve extends THREE.Curve<THREE.Vector3> {
    // We expose this so ArcLine can read it
    public readonly totalTime: number;

    private startPos: THREE.Vector3;
    private targetPos: THREE.Vector3;
    private phys: ReturnType<typeof calculateProjectileData>;
    private gravity: number

    constructor(startPos: THREE.Vector3, targetPos: THREE.Vector3, speed: number, gravity: number, type?: 0 | 1) {
        super();
        this.startPos = startPos;
        this.targetPos = targetPos;
        this.gravity = gravity
        this.phys = calculateProjectileData(startPos, targetPos, speed, gravity, type); // can be nullish if out of target

        // Save the time, or default to 1 to avoid division by zero errors
        this.totalTime = this.phys ? this.phys.totalTime : 1;
    }

    // the naming is important as it overrides the original THREE.Curve position calculation along the curve.
    getPoint(t: number, optionalTarget = new THREE.Vector3()): THREE.Vector3 {
        if (!this.phys) return optionalTarget.copy(this.startPos);

        const actualTime = t * this.phys.totalTime;

        // 1. Horizontal Slerp
        const axis = new THREE.Vector3().crossVectors(this.startPos, this.targetPos).normalize();
        const totalAngle = this.startPos.angleTo(this.targetPos);
        const currentPos = this.startPos.clone().applyAxisAngle(axis, totalAngle * t).setLength(this.phys.radius);

        // 2. Vertical Physics - exactly like 1D physics : y(t) = Vy0*sin(theta)*t - 0.5gt^2
        const heightOffset = (this.phys.v_y * actualTime) - (0.5 * 2 * Math.pow(actualTime, this.gravity));

        // 3. Combine - we need to add the height offset to our radius to add on top of the sphere surface.
        const finalHeight = Math.max(this.phys.radius, this.phys.radius + heightOffset);
        currentPos.setLength(finalHeight);

        return optionalTarget.copy(currentPos);
    }
}