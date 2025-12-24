import { create } from 'zustand'
import * as THREE from 'three'


type missile = {
    source: THREE.Vector3
    target: THREE.Vector3
}

// It's good practice to capitalize Type names
type MissileStore = {
    missiles: missile[]
    addMissile: (source: THREE.Vector3, target: THREE.Vector3) => void
    setMissiles: (missiles: missile[]) => void
}

export const useMissileStore = create<MissileStore>()((set) => ({
    missiles: [],


    addMissile: (source, target) => set((state) => ({
        missiles: [...state.missiles, { source, target }]
    })),


    setMissiles: (missiles) => set({ missiles }),
}))