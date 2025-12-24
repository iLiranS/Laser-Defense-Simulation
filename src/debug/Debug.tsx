import { button, useControls } from "leva"
import { useGameManagerStore } from "../store/gameManagerStore"

const Debug = () => {

    // Access setters directly
    const {
        setShowTrajectoryPrediction,
        setShowInterceptorHelper,
        setSimulationSpeed,
        setDetectRadius,
        setInterceptorsCount,
        setMissilesCount,
        setGravity,
        setMissilesSpeed,
        setFixedTarget,
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
        interceptorsHelper: {
            value: useGameManagerStore.getState().showInterceptorHelper,
            label: 'Show Radius',
            onChange: (v: boolean) => setShowInterceptorHelper(v)
        },
        fixedTarget: {
            value: useGameManagerStore.getState().fixedTarget,
            onChange: (v: boolean) => setFixedTarget(v)
        },
        speed: {
            value: useGameManagerStore.getState().simulationSpeed,
            min: 0.1,
            max: 5,
            step: 0.1,
            onEditEnd: (v: number) => setSimulationSpeed(v)
        },
        detectRadius: {
            value: 0.15,
            max: radius,
            min: 0.1,
            step: 0.01,
            onEditEnd: (v: number) => setDetectRadius(v)
        },
        interceptorsCount: {
            value: useGameManagerStore.getState().interceptorsCount,
            min: 0,
            max: 30,
            step: 1,
            onEditEnd: (v: number) => setInterceptorsCount(v)
        },
        missilesCount: {
            value: useGameManagerStore.getState().missilesCount,
            min: 0,
            max: 250,
            step: 1,
            onEditEnd: (v: number) => setMissilesCount(v)
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

        RANDOMIZE: button(() => {
            const missilesCount = Math.floor(Math.random() * 251)
            const interceptorsCount = Math.floor(Math.random() * 30)
            setInterceptorsCount(interceptorsCount)
            setMissilesCount(missilesCount)
        })
    }, { collapsed: false })

    // No useEffect needed!
    // This component now acts purely as a bridge and doesn't need to re-render itself.
    return null
}

export default Debug