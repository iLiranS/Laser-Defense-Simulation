import { useMemo } from 'react';
// 1. Import 'type' for TypeScript types
import type { ThreeElements } from '@react-three/fiber';
import geoJsonData from './geo.json'
import * as THREE from 'three'



// 2. Add the type for props
const EarthLines = (props: ThreeElements['lineSegments']) => {

    const geometry = useMemo(() => {
        const data = geoJsonData as any;

        // Extract geometry list from FeatureCollection
        const geo = data.type === "FeatureCollection"
            ? data.features.map((f: any) => f.geometry)
            : [data];

        const radius = 1;
        const positions: number[] = [];

        function pushVertex(lonDeg: number, latDeg: number) {
            const lon = -lonDeg * Math.PI / 180;
            const lat = latDeg * Math.PI / 180;

            const x = radius * Math.cos(lat) * Math.cos(lon);
            const y = radius * Math.sin(lat);
            const z = radius * Math.cos(lat) * Math.sin(lon);

            positions.push(x, y, z);
        }

        geo.forEach((geom: any) => {
            if (!geom) return;

            if (geom.type === "Polygon") {
                geom.coordinates.forEach((ring: any) => {
                    for (let i = 0; i < ring.length - 1; i++) {
                        const [lon1, lat1] = ring[i];
                        const [lon2, lat2] = ring[i + 1];


                        pushVertex(lon1, lat1);
                        pushVertex(lon2, lat2);
                    }
                });
            }
            if (geom.type === "MultiPolygon") {
                geom.coordinates.forEach((poly: any) => {
                    poly.forEach((ring: any) => {
                        for (let i = 0; i < ring.length - 1; i++) {
                            const [lon1, lat1] = ring[i];
                            const [lon2, lat2] = ring[i + 1];

                            pushVertex(lon1, lat1);
                            pushVertex(lon2, lat2);
                        }
                    });
                });
            }
        });

        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));



        return g;
    }, []);




    // 4. If geometry creation failed, render nothing
    if (!geometry) {
        return null;
    }

    return (

        <lineSegments geometry={geometry} {...props}>
            <lineBasicMaterial color="#ffffff" />
        </lineSegments>
    );
}

export default EarthLines;