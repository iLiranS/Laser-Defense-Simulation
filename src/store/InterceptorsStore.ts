import { create } from 'zustand'
import * as THREE from 'three'

export interface InterceptorEntry {
    id: string
    position: THREE.Vector3
}

type InterceptorsStore = {
    interceptors: InterceptorEntry[]
    addInterceptor: (entry: InterceptorEntry) => void
    setInterceptors: (interceptors: InterceptorEntry[]) => void
}

export const useInterceptorsStore = create<InterceptorsStore>()((set) => ({
    interceptors: [],

    addInterceptor: (entry) => set((state) => ({
        interceptors: [...state.interceptors, entry]
    })),

    setInterceptors: (interceptors) => set({ interceptors }),
}))