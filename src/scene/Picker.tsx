import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useApp } from '../state/store';
import type { PartId } from '../data/parts';
import { usePc } from './PcModel';

export default function Picker() {
  const { kit } = usePc();
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    const canvas = gl.domElement;
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let down: { x: number; y: number } | null = null;

    const pick = (ev: PointerEvent): PartId | null => {
      const r = canvas.getBoundingClientRect();
      ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      for (const h of ray.intersectObjects(kit.pickables, false)) {
        if (!h.object.visible) continue;
        const mat = (h.object as THREE.Mesh).material as THREE.Material;
        if (mat && mat.transparent && mat.opacity < 0.1) continue;
        return (h.object.userData as { part?: PartId }).part ?? null;
      }
      return null;
    };
    const onDown = (ev: PointerEvent) => { down = { x: ev.clientX, y: ev.clientY }; };
    const onUp = (ev: PointerEvent) => {
      if (!down) return;
      const moved = Math.abs(ev.clientX - down.x) + Math.abs(ev.clientY - down.y);
      down = null;
      if (moved > 8) return;
      const p = pick(ev);
      if (p) useApp.getState().togglePart(p);
    };
    const onMove = (ev: PointerEvent) => {
      if (ev.pointerType !== 'mouse' || ev.buttons) return;
      canvas.style.cursor = pick(ev) ? 'pointer' : 'grab';
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointermove', onMove);
    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointermove', onMove);
    };
  }, [gl, camera, kit]);

  return null;
}
