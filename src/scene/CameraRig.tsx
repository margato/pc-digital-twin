import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { useApp } from '../state/store';
import { prefersReducedMotion } from '../three-setup';
import { usePc } from './PcModel';

interface View { target: THREE.Vector3; pos: THREE.Vector3 }
interface Fly { p0: THREE.Vector3; t0: THREE.Vector3; p1: THREE.Vector3; t1: THREE.Vector3; s: number; d: number }

const DIR_DEFAULT = new THREE.Vector3(-0.45, 0.28, 1);
const DIR_GPU = new THREE.Vector3(-0.35, 0.95, 0.65);
const DIR_CPU = new THREE.Vector3(-0.2, 0.22, 1);
const DIR_RAM = new THREE.Vector3(0.75, 0.3, 0.75);
const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

export default function CameraRig() {
  const { group, kit } = usePc();
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const part = useApp((s) => s.part);
  const ctl = useRef<OrbitControlsImpl>(null);
  const fly = useRef<Fly | null>(null);
  const reduce = useMemo(prefersReducedMotion, []);
  const mounted = useRef(false);

  const fit = (b: THREE.Box3, dir: THREE.Vector3, padK: number, minR: number): View => {
    const sph = b.getBoundingSphere(new THREE.Sphere());
    const r = Math.max(sph.radius, minR);
    const vf = THREE.MathUtils.degToRad(camera.fov);
    const aspect = size.width && size.height ? size.width / size.height : camera.aspect;
    const hf = 2 * Math.atan(Math.tan(vf / 2) * aspect);
    const d = (r / Math.sin(Math.min(vf, hf) / 2)) * padK;
    return { target: sph.center.clone(), pos: sph.center.clone().add(dir.clone().normalize().multiplyScalar(d)) };
  };

  const currentView = (p: typeof part): View => {
    group.parent?.updateWorldMatrix(true, false);
    group.updateWorldMatrix(true, true);
    const focus = p ? kit.focusMeshes[p] : undefined;
    if (p === 'cpu' && focus && focus.length) {
      // frame the package only (substrate + IHS): ~45 mm chip fills about 60% of the view
      const b = new THREE.Box3();
      focus.forEach((m) => b.expandByObject(m));
      return fit(b, DIR_CPU, 1.6, 0.12);
    }
    const meshes = p ? kit.partMeshes[p] : undefined;
    if (p && meshes && meshes.length) {
      const b = new THREE.Box3();
      meshes.forEach((m) => b.expandByObject(m));
      const dir = p === 'gpu' ? DIR_GPU : p === 'ram' ? DIR_RAM : DIR_DEFAULT;
      return fit(b, dir, 1.0, 0.55);
    }
    return fit(new THREE.Box3().setFromObject(group), DIR_DEFAULT, 0.9, 0);
  };

  const go = (instant: boolean) => {
    const c = ctl.current;
    if (!c) return;
    useApp.getState().setViewDirty(false);
    const v = currentView(useApp.getState().part);
    if (instant || reduce) {
      camera.position.copy(v.pos);
      c.target.copy(v.target);
      c.update();
      fly.current = null;
      return;
    }
    fly.current = { p0: camera.position.clone(), t0: c.target.clone(), p1: v.pos, t1: v.target, s: performance.now(), d: 950 };
  };

  // Instant on first mount and on resize.
  useEffect(() => {
    camera.aspect = size.width / Math.max(1, size.height);
    camera.updateProjectionMatrix();
    // Resizing (e.g. dragging the panel edge) keeps the user's own view; only re-frame when the camera is at its default.
    if (!useApp.getState().viewDirty) go(true);
    mounted.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height]);

  // Fly on part change.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    go(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [part]);

  // Reset view button: fly back to the default framing of the current selection.
  const viewNonce = useApp((s) => s.viewNonce);
  const firstReset = useRef(true);
  useEffect(() => {
    if (firstReset.current) { firstReset.current = false; return; }
    go(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewNonce]);

  // Orbit step shared by the keyboard and the on-screen buttons: dTheta/dPhi in radians, zoom as a radius multiplier.
  const nudge = (dTheta: number, dPhi: number, zoom: number) => {
    const c = ctl.current;
    if (!c) return;
    const sph = new THREE.Spherical().setFromVector3(camera.position.clone().sub(c.target));
    sph.theta += dTheta;
    sph.phi += dPhi;
    sph.radius *= zoom;
    fly.current = null;
    sph.phi = THREE.MathUtils.clamp(sph.phi, 0.05, c.maxPolarAngle - 0.001);
    sph.radius = THREE.MathUtils.clamp(sph.radius, c.minDistance, c.maxDistance);
    camera.position.copy(c.target).add(new THREE.Vector3().setFromSpherical(sph));
    c.update();
    useApp.getState().setViewDirty(true);
  };

  // On-screen buttons.
  const camCmd = useApp((s) => s.camCmd);
  useEffect(() => {
    if (!camCmd) return;
    if (camCmd.kind === 'zoomIn') nudge(0, 0, 0.8);
    else if (camCmd.kind === 'zoomOut') nudge(0, 0, 1.25);
    else if (camCmd.kind === 'rotL') nudge(-0.35, 0, 1);
    else nudge(0.35, 0, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camCmd]);

  // Keyboard orbit: arrows rotate, +/- zoom. Shift makes each step larger.
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const dom = gl.domElement;
    dom.tabIndex = 0;
    const onKey = (e: KeyboardEvent) => {
      const step = e.shiftKey ? 0.2 : 0.08;
      switch (e.key) {
        case 'ArrowLeft': nudge(-step, 0, 1); break;
        case 'ArrowRight': nudge(step, 0, 1); break;
        case 'ArrowUp': nudge(0, -step, 1); break;
        case 'ArrowDown': nudge(0, step, 1); break;
        case '+': case '=': nudge(0, 0, 0.9); break;
        case '-': case '_': nudge(0, 0, 1.1); break;
        default: return;
      }
      e.preventDefault();
    };
    dom.addEventListener('keydown', onKey);
    return () => dom.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, gl]);

  useFrame(() => {
    const f = fly.current, c = ctl.current;
    if (!f || !c) return;
    const k = Math.min(1, (performance.now() - f.s) / f.d), e = ease(k);
    camera.position.lerpVectors(f.p0, f.p1, e);
    c.target.lerpVectors(f.t0, f.t1, e);
    if (k >= 1) fly.current = null;
    c.update();
  });

  return (
    <OrbitControls
      ref={ctl}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan={false}
      zoomSpeed={0.4}
      minDistance={part ? 0.08 : 0.35}
      maxDistance={45}
      maxPolarAngle={part ? Math.PI * 0.8 : Math.PI / 2 - 0.03}
      onStart={() => { fly.current = null; useApp.getState().setViewDirty(true); }}
    />
  );
}
