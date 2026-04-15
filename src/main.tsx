
import { createRoot } from 'react-dom/client'
import './index.css'
import { Canvas } from '@react-three/fiber'
import Experience from './Experience'
import SimulationPanel from './ui/SimulationPanel'


//TODO: Don't forget pointer events to none the html part

createRoot(document.getElementById('root')!).render(
  <>
    <Canvas dpr={[1, 1.5]}

      camera={{
        fov: 45,
        near: 0.1,
        far: 200,
        position: [1.0, 0.75, -0.7]
      }}
    >
      <Experience />
    </Canvas>
    <SimulationPanel />
  </>
)
