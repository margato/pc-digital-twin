import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { renderStats, useSettings } from '../state/settings';

export default function FPSLimiter() {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const original = gl.render.bind(gl);
    let last = 0;
    gl.render = (scene, camera) => {
      const limit = useSettings.getState().fpsLimit;
      const now = performance.now();
      // 1 ms tolerance so a 60 Hz display still hits a 60 FPS cap
      if (limit && now - last < 1000 / limit - 1) return;
      last = now;
      renderStats.frames++;
      original(scene, camera);
    };
    return () => {
      gl.render = original;
    };
  }, [gl]);
  return null;
}
