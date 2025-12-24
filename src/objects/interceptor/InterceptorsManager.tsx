import { useRef, useEffect } from "react"
import { useInterceptorsStore } from "../../store/InterceptorsStore"
import { useGameManagerStore } from "../../store/gameManagerStore"
import * as THREE from 'three'
import { randomPointOnSphere } from "../../utils/coordconvertions"

// interceptor geometry/material
const boxGeo = new THREE.BoxGeometry(1, 1, 1)
const boxMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.1, 4, 0.1)
})

// helper geometry/material (shared)
function createHelperGeometry(radius: number) {
    return new THREE.SphereGeometry(radius, 32, 16)
}
const helperMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.05, 1, 0.1),
    transparent: true,
    opacity: 0.1,
    side: THREE.FrontSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
})

// for demo -random interceptors
const getRandomInterceptors = (count: number, radius: number, fixedTarget: boolean): THREE.Vector3[] => {
    if (fixedTarget) return [new THREE.Vector3(0.704355292418356, 0.5227659587170155, -0.49053478413761004)]
    const interceptors = Array.from({ length: count }, () => {
        const res = randomPointOnSphere(radius)
        // const target1 = new THREE.Vector3(0.704355292418356, 0.5227659587170155, -0.49053478413761004)
        return new THREE.Vector3(res[0], res[1], res[2])
    })
    return interceptors
}

// temp objects
const tempMatrix = new THREE.Matrix4()
const tempQuat = new THREE.Quaternion()
const up = new THREE.Vector3(0, 1, 0)
const normal = new THREE.Vector3()
const pos = new THREE.Vector3()

export default function InterceptorsManager() {

    const { interceptors, setInterceptors } = useInterceptorsStore()
    const showInterceptorHelper = useGameManagerStore(s => s.showInterceptorHelper)
    const detectRadius = useGameManagerStore(s => s.detectRadius)
    const fixedTarget = useGameManagerStore(s => s.fixedTarget)

    const interceptorMeshRef = useRef<THREE.InstancedMesh>(null)
    const helperMeshRef = useRef<THREE.InstancedMesh>(null)

    // recreate helper geometry whenever detectRadius changes
    const helperGeoRef = useRef<THREE.SphereGeometry>(createHelperGeometry(detectRadius))
    if (helperGeoRef.current.parameters.radius !== detectRadius) {
        helperGeoRef.current = createHelperGeometry(detectRadius)
    }

    // for demo purpopses 
    const interceptorsCount = useGameManagerStore(s => s.interceptorsCount)
    const radius = useGameManagerStore(s => s.radius)
    useEffect(() => {
        const rand_interceptors = getRandomInterceptors(interceptorsCount, radius, fixedTarget)
        setInterceptors(rand_interceptors)
    }, [interceptorsCount, radius, setInterceptors, fixedTarget])

    // update interceptor transforms
    useEffect(() => {
        if (!interceptorMeshRef.current) return

        interceptors.forEach((interceptor, i) => {


            // position on sphere
            pos.set(interceptor.x, interceptor.y, interceptor.z)

            // outward normal
            normal.copy(pos).normalize()

            // orientation
            tempQuat.setFromUnitVectors(up, normal)

            // small object scale
            const scale = 0.01

            // bottom-pivot so add half it's height * scale
            pos.addScaledVector(normal, scale * 0.5)

            tempMatrix.compose(
                pos.clone(), // no vertical lift needed
                tempQuat,
                new THREE.Vector3(scale, scale, scale)
            )

            if (interceptorMeshRef.current) interceptorMeshRef.current.setMatrixAt(i, tempMatrix)
        })

        interceptorMeshRef.current.instanceMatrix.needsUpdate = true
    }, [interceptors])

    // update helper positions if displayed
    useEffect(() => {
        if (!helperMeshRef.current) return
        if (!showInterceptorHelper) return

        interceptors.forEach((interceptor, i) => {
            pos.set(interceptor.x, interceptor.y, interceptor.z)
            tempMatrix.compose(
                pos,
                new THREE.Quaternion(),  // helpers don't rotate
                new THREE.Vector3(1, 1, 1)
            )

            helperMeshRef.current!.setMatrixAt(i, tempMatrix)
        })

        helperMeshRef.current.instanceMatrix.needsUpdate = true
    }, [interceptors, showInterceptorHelper, detectRadius])


    return (
        <>
            {/* MAIN INTERCEPTORS */}
            <instancedMesh
                ref={interceptorMeshRef}
                args={[boxGeo, boxMat, interceptors.length]}
            />

            {/* HELPERS (only rendered if enabled) */}
            {showInterceptorHelper &&
                <instancedMesh
                    ref={helperMeshRef}
                    args={[helperGeoRef.current, helperMat, interceptors.length]}
                />
            }
        </>
    )
}
