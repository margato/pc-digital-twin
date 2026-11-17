import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import Studio from './Studio';
import { PcProvider, PcModel } from './PcModel';
import CameraRig from './CameraRig';
import Picker from './Picker';
import { DebugTracker } from '../ui/DebugOverlay';
import { FEATURES } from '../config/features';
import FPSLimiter from './FPSLimiter';

/** The whole 3D view: one R3F canvas, studio, model, camera and picking. */
export default function Stage() {
  return (
    <Canvas
      className="stage-canvas"
      role="img"
      aria-label="True-scale 3D model of the gaming PC. The Parts list in the panel gives the same details as text."
      style={{ touchAction: 'none', cursor: 'grab' }}
      legacy
      dpr={[1, 2]}
      shadows="soft"
      gl={{ antialias: true, logarithmicDepthBuffer: true }}
      camera={{ fov: 40, near: 0.03, far: 150, position: [0, 8, 30] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.0;
        (gl as unknown as { useLegacyLights: boolean }).useLegacyLights = true;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
        gl.setClearColor(0xf4f4f6, 1);
        gl.domElement.style.touchAction = 'none';
        gl.domElement.style.cursor = 'grab';
      }}
    >
      <Studio />
      <PcProvider>
        <PcModel />
        <CameraRig />
        <Picker />
      </PcProvider>
      <DebugTracker />
      {FEATURES.fpsLimit ? <FPSLimiter /> : null}
    </Canvas>
  );
}
