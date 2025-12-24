import { useEffect, useRef } from "react"
import { useGameManagerStore } from "../../store/gameManagerStore"
import { useMissileStore } from "../../store/missilesStore"
import Missile from "./Missile"
import * as THREE from 'three'
import { useFrame } from "@react-three/fiber"
import { randomPointOnSphere } from "../../utils/coordconvertions"
// import { useGLTF } from "@react-three/drei"

const missileGeometry = new THREE.BoxGeometry(1, 1, 2)
const missileMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(7, 1, 1) })

// random missiles - for demo
const getRandomMissiles = (count: number, radius: number, fixedTarget: boolean) => {
    const missiles = Array.from({ length: count }, () => {
        const res = randomPointOnSphere(radius)
        let res2 = new THREE.Vector3(0.704355292418356, 0.5227659587170155, -0.49053478413761004)
        if (!fixedTarget) {
            const p = randomPointOnSphere(radius)
            res2 = new THREE.Vector3(p[0], p[1], p[2])
        }
        return {
            source: new THREE.Vector3(res[0], res[1], res[2]),
            target: res2,
        }
    });
    return missiles
}


const MissileManager = () => {
    const radius = useGameManagerStore(s => s.radius)
    const fixedTarget = useGameManagerStore(s => s.fixedTarget)

    const { missiles, setMissiles } = useMissileStore()
    const meshRef = useRef<THREE.InstancedMesh>(null) // positions will be set inside ArcLine.tsx
    // const rocket = useGLTF('/models/Rocket.glb')

    // demo
    const missilesCount = useGameManagerStore(state => state.missilesCount)
    useEffect(() => {
        const randomMissiles = getRandomMissiles(missilesCount, radius, fixedTarget)
        setMissiles(randomMissiles)
    }, [missilesCount, radius, setMissiles, fixedTarget])


    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.instanceMatrix.needsUpdate = true
        }
    })


    return (
        <>

            {missiles.map((missile, index) => <Missile id={index} instancedMeshRef={meshRef} key={`missile-${index}-${missilesCount}`} source={missile.source} target={missile.target} radius={radius} />)}

            {/* missiles instanced mesh*/}
            <instancedMesh ref={meshRef} args={[missileGeometry, missileMaterial, missiles.length]} />

        </>
    )

}
export default MissileManager