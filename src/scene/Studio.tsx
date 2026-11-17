import { useEffect, useMemo, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { isMobile } from '../three-setup';

/** Equirectangular white studio with soft-box strips. */
function makeEnv(): THREE.DataTexture {
  const ew = 256, eh = 128, data = new Uint16Array(ew * eh * 4), toH = THREE.DataUtils.toHalfFloat;
  for (let y = 0; y < eh; y++) {
    const el = (0.5 - (y + 0.5) / eh) * Math.PI;
    for (let x = 0; x < ew; x++) {
      const az = ((x + 0.5) / ew) * Math.PI * 2;
      const up = Math.max(0, Math.sin(el));
      let v = el < 0 ? 0.42 - 0.12 * Math.min(1, -el) : 0.72 + 0.22 * up;
      const strip =
        Math.exp(-Math.pow((el - 0.5) / 0.1, 2)) *
        (Math.pow(Math.max(0, Math.cos(az - 0.9)), 14) + 0.7 * Math.pow(Math.max(0, Math.cos(az - 3.9)), 14));
      const top = Math.exp(-Math.pow((el - 1.4) / 0.2, 2));
      v += strip * 3.2 + top * 1.4;
      const k = (y * ew + x) * 4;
      data[k] = toH(v); data[k + 1] = toH(v); data[k + 2] = toH(v * 1.02); data[k + 3] = toH(1);
    }
  }
  const env = new THREE.DataTexture(data, ew, eh, THREE.RGBAFormat, THREE.HalfFloatType);
  env.mapping = THREE.EquirectangularReflectionMapping;
  env.magFilter = THREE.LinearFilter;
  env.minFilter = THREE.LinearFilter;
  env.needsUpdate = true;
  return env;
}

const LIGHT_BG = 0xf4f4f6;
const DARK_BG = 0x0b0c10;

function isDarkTheme(): boolean {
  const t = document.documentElement.dataset.theme;
  if (t === 'dark') return true;
  if (t === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Follows the data-theme attribute and the system colour scheme. */
function useDark(): boolean {
  const [dark, setDark] = useState(isDarkTheme);
  useEffect(() => {
    const upd = () => setDark(isDarkTheme());
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', upd);
    const mo = new MutationObserver(upd);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    upd();
    return () => { mq.removeEventListener('change', upd); mo.disconnect(); };
  }, []);
  return dark;
}

/** userData tag for the shadow-catcher floor. */
export const FLOOR_RASTER = 'floorRaster';

export default function Studio() {
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const dark = useDark();
  const bg = dark ? DARK_BG : LIGHT_BG;
  const shadowRef = useRef<THREE.ShadowMaterial>(null);
  const env = useMemo(makeEnv, []);
  const spot = useMemo(() => {
    const key = new THREE.SpotLight(0xffffff, 1.0, 0, 0.6, 0.75, 1);
    key.position.set(5, 16, 10);
    key.target.position.set(0, 2.5, 0);
    key.castShadow = true;
    const ms = isMobile ? 2048 : 4096;
    key.shadow.mapSize.set(ms, ms);
    key.shadow.camera.near = 6;
    key.shadow.camera.far = 40;
    key.shadow.bias = -0.0002;
    key.shadow.normalBias = 0.006;
    key.shadow.radius = 6;
    return key;
  }, []);

  useEffect(() => {
    scene.environment = env;
    return () => { scene.environment = null; };
  }, [scene, env]);

  useEffect(() => {
    gl.setClearColor(bg, 1);
    scene.environmentIntensity = dark ? 0.8 : 1;
    if (shadowRef.current) shadowRef.current.opacity = dark ? 0.42 : 0.16;
    invalidate();
  }, [gl, scene, bg, dark, invalidate]);

  return (
    <>
      <hemisphereLight args={[0xffffff, 0xd9d9de, 0.55]} />
      <primitive object={spot} />
      <primitive object={spot.target} />
      <directionalLight args={[0xffffff, 0.35]} position={[-8, 6, 4]} />
      <directionalLight args={[0xffffff, 0.3]} position={[-2, 8, -10]} />
      <mesh rotation-x={-Math.PI / 2} receiveShadow userData={{ [FLOOR_RASTER]: true }}>
        <planeGeometry args={[80, 80]} />
        <shadowMaterial ref={shadowRef} opacity={0.16} />
      </mesh>
    </>
  );
}
