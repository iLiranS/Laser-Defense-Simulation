import { create } from 'zustand'




// It's good practice to capitalize Type names
type gameManagerStore = {
    radius: number
    simulationSpeed: number
    showTrajectoryPrediction: boolean
    showInterceptorHelper: boolean
    detectRadius: number
    interceptorsCount: number // for demo
    missilesCount: number // for demo
    gravity: number
    missileSpeed: number
    fixedTarget: boolean

    setRadius: (newRadius: number) => void
    setSimulationSpeed: (newSpeed: number) => void
    setShowTrajectoryPrediction: (val: boolean) => void
    setShowInterceptorHelper: (val: boolean) => void
    setDetectRadius: (val: number) => void
    setMissilesCount: (val: number) => void
    setInterceptorsCount: (val: number) => void
    setGravity: (val: number) => void
    setMissilesSpeed: (val: number) => void
    setFixedTarget: (val: boolean) => void
}

export const useGameManagerStore = create<gameManagerStore>()((set) => ({
    radius: 1,
    simulationSpeed: 1,
    showTrajectoryPrediction: true,
    showInterceptorHelper: true,
    detectRadius: 0.15,
    missilesCount: 25,
    interceptorsCount: 5,
    gravity: 2,
    missileSpeed: 3,
    fixedTarget: false,

    setRadius: (radius) => set({ radius }),
    setSimulationSpeed: (simulationSpeed) => set({ simulationSpeed }),
    setShowTrajectoryPrediction: (showTrajectoryPrediction) => set({ showTrajectoryPrediction }),
    setShowInterceptorHelper: (showInterceptorHelper) => set({ showInterceptorHelper }),
    setDetectRadius: (detectRadius) => set({ detectRadius }),
    setInterceptorsCount: (interceptorsCount) => set({ interceptorsCount }),
    setMissilesCount: (missilesCount) => set({ missilesCount }),
    setGravity: (gravity) => set({ gravity }),
    setMissilesSpeed: (missileSpeed) => set({ missileSpeed }),
    setFixedTarget: (fixedTarget) => set({ fixedTarget }),


}))