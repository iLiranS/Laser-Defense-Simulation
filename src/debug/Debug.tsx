import { button, useControls } from "leva"
import { useGameManagerStore } from "../store/gameManagerStore"
import { useSimulationStore } from "../store/simulationStore"

const Debug = () => {

    // Access setters directly
    const {
        setShowTrajectoryPrediction,
        setShowRadarRadius,
        setSimulationSpeed,
        setInterceptorsCount,
        setGravity,
        setMissilesSpeed,
        radius,
        // setRadius // for now not needed
    } = useGameManagerStore()

    useControls('Debug', {
        trajectory: {
            // 1. Set initial value from the store's default/current state
            value: useGameManagerStore.getState().showTrajectoryPrediction,

            // 2. Update store immediately when changed
            onChange: (v: boolean) => setShowTrajectoryPrediction(v)
        },
        showRadar: {
            value: useGameManagerStore.getState().showRadarRadius,
            label: 'Show Radar',
            onChange: (v: boolean) => setShowRadarRadius(v)
        },
        speed: {
            value: useGameManagerStore.getState().simulationSpeed,
            min: 0.1,
            max: 5,
            step: 0.1,
            onEditEnd: (v: number) => setSimulationSpeed(v)
        },
        interceptorsCount: {
            value: useGameManagerStore.getState().interceptorsCount,
            min: 0,
            max: 30,
            step: 1,
            onEditEnd: (v: number) => setInterceptorsCount(v)
        },
        gravity: {
            value: useGameManagerStore.getState().gravity,
            min: 1,
            max: 10,
            step: 0.01,
            onEditEnd: (v: number) => setGravity(v),
            disabled: true
        },
        missileSpeed: {
            value: useGameManagerStore.getState().missileSpeed,
            min: Math.sqrt(radius * Math.PI * 2 * useGameManagerStore.getState().gravity),
            max: 10,
            step: 0.1,
            onEditEnd: (v: number) => setMissilesSpeed(v)
        },
        showInterceptors: {
            value: useGameManagerStore.getState().showInterceptors,
            label: 'Show Interceptors',
            onChange: (v: boolean) => useGameManagerStore.getState().setShowInterceptors(v)
        }
    }, { collapsed: true })

    // Simulation controls
    const simStore = useSimulationStore.getState()

    useControls('Simulation', {
        radarRadius: {
            value: simStore.radarRadius,
            min: 0.03,
            max: 1.0,
            step: 0.005,
            onChange: (v: number) => useSimulationStore.getState().setRadarRadius(v),
        },
        maxInterceptorsPerMissile: {
            value: simStore.maxInterceptorsPerMissile,
            label: 'Max Interceptors/Missile',
            min: 1,
            max: 10,
            step: 1,
            onChange: (v: number) => useSimulationStore.getState().setMaxInterceptorsPerMissile(v),
        },
        'Preset: Light Attack': button(() => {
            useSimulationStore.getState().setWaveConfig({ missileCount: 25, interval: 10 })
            useSimulationStore.getState().setTotalWaves(3)
        }),
        'Preset: Saturated': button(() => {
            useSimulationStore.getState().setWaveConfig({ missileCount: 35, interval: 7 })
            useSimulationStore.getState().setTotalWaves(5)
        }),
        'Preset: Heavy Barrage': button(() => {
            useSimulationStore.getState().setWaveConfig({ missileCount: 50, interval: 5 })
            useSimulationStore.getState().setTotalWaves(7)
        }),
    }, { collapsed: false })

    // This component acts purely as a bridge and doesn't need to render anything.
    return null
}

export default Debug