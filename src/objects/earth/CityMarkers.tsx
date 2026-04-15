import { useMemo } from 'react'
import * as THREE from 'three'
import { CITIES, getZoneColor } from '../../data/cityData'
import { Html } from '@react-three/drei'

const RING_SEGMENTS = 64

/**
 * Renders visual markers (rings + labels) for each city zone on the globe.
 * Rings are color-coded: red = city, orange = rural, green = open.
 */
export default function CityMarkers() {
    const markers = useMemo(() => {
        return CITIES.map(city => {
            // Build a ring geometry lying flat, then orient it to the city's surface normal
            const ringPoints: THREE.Vector3[] = []
            for (let i = 0; i <= RING_SEGMENTS; i++) {
                const angle = (i / RING_SEGMENTS) * Math.PI * 2
                ringPoints.push(new THREE.Vector3(
                    Math.cos(angle) * city.radius,
                    0,
                    Math.sin(angle) * city.radius,
                ))
            }

            // Rotation: align Y-up ring to point outward along city normal
            const normal = city.cartesianPos.clone().normalize()
            const quaternion = new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                normal,
            )

            // Lift ring slightly above surface to avoid z-fighting
            const position = city.cartesianPos.clone().multiplyScalar(1.002)

            const color = getZoneColor(city.zoneType)

            return { city, ringPoints, quaternion, position, color }
        })
    }, [])

    return (
        <group>
            {markers.map(({ city, ringPoints, quaternion, position, color }) => (
                <group key={city.name} position={position} quaternion={quaternion}>
                    {/* Ring outline */}
                    <line>
                        <bufferGeometry>
                            <bufferAttribute
                                attach="attributes-position"
                                args={[new Float32Array(ringPoints.flatMap(p => [p.x, p.y, p.z])), 3]}
                            />
                        </bufferGeometry>
                        <lineBasicMaterial
                            color={color}
                            transparent
                            opacity={0.6}
                        />
                    </line>

                    {/* City label */}
                    <Html
                        position={[0, 0.005, 0]}
                        center
                        distanceFactor={2}
                        style={{
                            pointerEvents: 'none',
                            userSelect: 'none',
                        }}
                    >
                        <div style={{
                            color: `#${color.getHexString()}`,
                            fontSize: '9px',
                            fontFamily: 'monospace',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            textShadow: '0 0 4px rgba(0,0,0,0.8)',
                            opacity: 0.85,
                        }}>
                            {/* {city.name} */}
                        </div>
                    </Html>
                </group>
            ))}
        </group>
    )
}
