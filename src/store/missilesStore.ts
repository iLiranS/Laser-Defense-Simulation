import { create } from 'zustand'
import * as THREE from 'three'
import { MissileType } from '../types/global'

export interface MissileEntry {
    source: THREE.Vector3
    target: THREE.Vector3
    missileType: MissileType
    spawnDelay: number           // jitter within wave
}

type MissileStore = {
    missiles: MissileEntry[]
    addMissile: (entry: MissileEntry) => void
    setMissiles: (missiles: MissileEntry[]) => void
}

export const useMissileStore = create<MissileStore>()((set) => ({
    missiles: [],

    addMissile: (entry) => set((state) => ({
        missiles: [...state.missiles, entry]
    })),

    setMissiles: (missiles) => set({ missiles }),
}))