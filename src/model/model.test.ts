import { describe, it, expect, beforeAll } from 'vitest';
import * as THREE from 'three';
import { buildPcModel } from './index';

// No DOM in the node env: canvasTex only needs a canvas whose 2D context accepts any call.
beforeAll(() => {
  // Gradients come back as objects whose methods are no-ops, so addColorStop and friends don't throw.
  const gradient = { addColorStop: () => undefined };
  const ctx: unknown = new Proxy(function () {}, {
    get: (_t, key) => (key === 'createLinearGradient' || key === 'createRadialGradient' ? () => gradient : () => undefined),
    set: () => true
  });
  (globalThis as unknown as { document: unknown }).document = {
    createElement: () => ({ width: 0, height: 0, getContext: () => ctx })
  };
});

function summary() {
  const { group, kit } = buildPcModel();
  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(group);
  const r = (n: number) => Math.round(n) || 0; // `|| 0` turns -0 into 0 so toEqual is stable
  const perPart: Record<string, number> = {};
  const matsPerPart: Record<string, number> = {};
  let sig = 0;
  kit.pickables.forEach((m, i) => {
    const p = (m.userData as { part: string }).part;
    perPart[p] = (perPart[p] || 0) + 1;
    const pos = m.position;
    sig = (sig * 31 + Math.round((pos.x * 7 + pos.y * 13 + pos.z * 17) * 10) + i * 3 + p.length) % 1000000007;
  });
  kit.pcMats.forEach((pm) => { matsPerPart[pm.part] = (matsPerPart[pm.part] || 0) + 1; });
  let meshes = 0;
  group.traverse((o) => { if ((o as THREE.Mesh).isMesh) meshes++; });
  return {
    perPart, matsPerPart, pickables: kit.pickables.length, meshes, spinners: kit.spinners.length, dims: kit.dims.length,
    bbox: { min: [r(box.min.x), r(box.min.y), r(box.min.z)], max: [r(box.max.x), r(box.max.y), r(box.max.z)] },
    sig
  };
}

describe('PC model structure', () => {
  it('matches the recorded baseline', () => {
    const s = summary();
    expect(s).toEqual(BASELINE);
  });
});

// Regression guard for the model. Update deliberately when a part's geometry changes on purpose.
const BASELINE = {"perPart":{"case":161,"board":132,"cpu":28,"cooler":100,"ram":60,"gpu":131,"ssd":18,"psu":24},"matsPerPart":{"case":23,"board":18,"cpu":12,"cooler":16,"ram":13,"gpu":37,"ssd":14,"psu":21},"pickables":654,"meshes":657,"spinners":10,"dims":3,"bbox":{"min":[-243,0,-116],"max":[243,507,116]},"sig":169320593};
