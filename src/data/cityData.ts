import * as THREE from 'three'
import { ZoneType } from '../types/global'
import { sphericalToCartesian } from '../utils/coordconvertions'

export interface City {
    name: string
    lat: number           // radians
    long: number          // radians
    radius: number        // zone radius on the unit sphere (how big the "city area" is)
    zoneType: ZoneType
    cartesianPos: THREE.Vector3
}

// Convert degrees to radians helper
const deg2rad = (deg: number): number => deg * (Math.PI / 180)

/**
 * Israeli cities/zones mapped onto a unit sphere.
 * Coordinates are approximate real-world lat/long converted to radians.
 */
const RAW_CITIES: Omit<City, 'cartesianPos'>[] = [
    // Major cities (Z = 9)
    { name: 'Tel Aviv', lat: deg2rad(32.08), long: deg2rad(34.78), radius: 0.01, zoneType: ZoneType.CITY },
    { name: 'Haifa', lat: deg2rad(32.79), long: deg2rad(34.99), radius: 0.006, zoneType: ZoneType.CITY },
    { name: 'Beer Sheva', lat: deg2rad(31.25), long: deg2rad(34.79), radius: 0.006, zoneType: ZoneType.CITY },
    // { name: 'Jerusalem',  lat: deg2rad(31.77),  long: deg2rad(35.21),  radius: 0.02,  zoneType: ZoneType.CITY },

    // Rural settlements (Z = 3)
    // { name: 'Ashkelon',   lat: deg2rad(31.67),  long: deg2rad(34.57),  radius: 0.015, zoneType: ZoneType.RURAL },
    // { name: 'Netanya',    lat: deg2rad(32.33),  long: deg2rad(34.86),  radius: 0.015, zoneType: ZoneType.RURAL },
    // { name: 'Tiberias',   lat: deg2rad(32.79),  long: deg2rad(35.53),  radius: 0.012, zoneType: ZoneType.RURAL },
    { name: 'Eilat', lat: deg2rad(29.75), long: deg2rad(34.9), radius: 0.007, zoneType: ZoneType.RURAL },

    // Open areas (Z = 1)
    { name: 'Negev', lat: deg2rad(30.55), long: deg2rad(34.89), radius: 0.007, zoneType: ZoneType.OPEN },
    { name: 'Golan', lat: deg2rad(33.00), long: deg2rad(35.75), radius: 0.005, zoneType: ZoneType.OPEN },
]

// Pre-compute cartesian positions
export const CITIES: City[] = RAW_CITIES.map(city => ({
    ...city,
    cartesianPos: sphericalToCartesian({ lat: city.lat, long: city.long }),
}))

/**
 * Classifies the predicted impact position into a zone type.
 * Checks all cities — returns the HIGHEST zone weight that the impact falls within.
 * Falls back to SEA if no zone matches (simple heuristic: if impact is near
 * the defined region at all → OPEN, otherwise → SEA).
 * 
 * Complexity: O(C) where C = number of cities.
 */
export function classifyImpactZone(impactPos: THREE.Vector3): ZoneType {
    let bestZone = ZoneType.SEA

    for (const city of CITIES) {
        const dist = impactPos.distanceTo(city.cartesianPos)
        if (dist <= city.radius) {
            // Take the highest priority zone (city > rural > open)
            if (city.zoneType > bestZone) {
                bestZone = city.zoneType
            }
        }
    }

    return bestZone
}

/**
 * Returns the zone color for visualization.
 */
export function getZoneColor(zone: ZoneType): THREE.Color {
    switch (zone) {
        case ZoneType.CITY: return new THREE.Color(1.0, 0.15, 0.15)   // red
        case ZoneType.RURAL: return new THREE.Color(1.0, 0.6, 0.1)     // orange
        case ZoneType.OPEN: return new THREE.Color(0.2, 0.8, 0.2)     // green
        case ZoneType.SEA: return new THREE.Color(0.2, 0.4, 1.0)     // blue
    }
}
