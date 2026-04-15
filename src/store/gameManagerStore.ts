import { create } from 'zustand'




// It's good practice to capitalize Type names
type gameManagerStore = {
    radius: number
    simulationSpeed: number
    showTrajectoryPrediction: boolean
    showRadarRadius: boolean
    interceptorsCount: number // for demo
    gravity: number
    missileSpeed: number
    showInterceptors: boolean

    setRadius: (newRadius: number) => void
    setSimulationSpeed: (newSpeed: number) => void
    setShowTrajectoryPrediction: (val: boolean) => void
    setShowRadarRadius: (val: boolean) => void
    setInterceptorsCount: (val: number) => void
    setGravity: (val: number) => void
    setMissilesSpeed: (val: number) => void
    setShowInterceptors: (val: boolean) => void
}

export const useGameManagerStore = create<gameManagerStore>()((set) => ({
    radius: 1,
    simulationSpeed: 5,
    showTrajectoryPrediction: false,
    showRadarRadius: true,
    interceptorsCount: 5,
    gravity: 2,
    missileSpeed: 3,
    showInterceptors: false,

    setRadius: (radius) => set({ radius }),
    setSimulationSpeed: (simulationSpeed) => set({ simulationSpeed }),
    setShowTrajectoryPrediction: (showTrajectoryPrediction) => set({ showTrajectoryPrediction }),
    setShowRadarRadius: (showRadarRadius) => set({ showRadarRadius }),
    setInterceptorsCount: (interceptorsCount) => set({ interceptorsCount }),
    setGravity: (gravity) => set({ gravity }),
    setMissilesSpeed: (missileSpeed) => set({ missileSpeed }),
    setShowInterceptors: (showInterceptors) => set({ showInterceptors }),

}))