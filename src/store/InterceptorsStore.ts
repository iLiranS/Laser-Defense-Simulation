import { create } from 'zustand'
import * as THREE from 'three'



type InterceptorsStore = {
    interceptors: THREE.Vector3[]
    addInterceptor: (interceptor: THREE.Vector3) => void
    setInterceptors: (interceptors: THREE.Vector3[]) => void
}

export const useInterceptorsStore = create<InterceptorsStore>()((set) => ({
    interceptors: [],


    addInterceptor: (interceptor) => set((state) => ({
        interceptors: [...state.interceptors, interceptor]
    })),


    setInterceptors: (interceptors) => set({ interceptors }),
}))