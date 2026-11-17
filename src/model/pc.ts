import * as THREE from 'three';
import type { Kit } from './kit';
import { createShared } from './parts/shared';
import type { ResolvedBuild } from '../builds';
import { BUILD_ORDER, builderFor, requestedBuilders } from './registry';

/**
 * Gaming PC in case millimetres. Axes: front of the case at +x, glass side at +z, floor at y = 0.
 * Every mesh that carries a PartTag is pickable and isolatable by part.
 * Each component's model is picked by the `model.builder` name on its spec sheet (see registry.ts); shapes follow the reference photos of the real parts.
 */
export function buildPC(kit: Kit, resolved: ResolvedBuild): THREE.Group {
  const requested = requestedBuilders(resolved);
  const shared = createShared(kit);
  const g = new THREE.Group();
  for (const id of BUILD_ORDER) builderFor(id, requested[id])(kit, g, shared);

  kit.addDims([
    { a: [-240, 0, 145], b: [240, 0, 145], c: [0, 12, 0], t: '480 mm' },
    { a: [270, 0, 115], b: [270, 505, 115], c: [12, 0, 0], t: '505 mm' },
    { a: [270, 0, -115], b: [270, 0, 115], c: [0, 12, 0], t: '230 mm' }
  ]);
  return g;
}
