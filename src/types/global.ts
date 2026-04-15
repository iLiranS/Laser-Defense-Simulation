import * as THREE from 'three'


export type cartesianCoords = THREE.Vector3

export type sphericalCoords = {
    lat: number,
    long: number,
    altitude?: number,
    radius?: number,
}
export type coords = cartesianCoords | sphericalCoords


// ── Missile Types (Warhead weight W_i) ──
export enum MissileType {
    LIGHT = 1,
    MEDIUM = 3,
    HEAVY = 5,
}

// ── Zone Classification (Zone weight Z_i) ──
export enum ZoneType {
    SEA = 0,
    OPEN = 1,
    RURAL = 3,
    CITY = 9,
}

// ── Dwell Time per missile type (seconds of continuous laser to destroy) ──
export const DWELL_TIME: Record<MissileType, number> = {
    [MissileType.LIGHT]: 0.3,
    [MissileType.MEDIUM]: 0.6,
    [MissileType.HEAVY]: 1.2,
}

// ── Simulation Constants ──
export const T_SAFETY = 0.01          // safety margin: if TTI < D_rem + T_SAFETY → lost cause
export const EPSILON = 0.0001         // numerical stability for division
export const SWITCHING_DELTA = 0.1   // penalty threshold for target switching (hysteresis)
