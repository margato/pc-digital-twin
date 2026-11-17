import type * as THREE from 'three';
import { DEFAULT_BUILD, resolveBuild, type ResolvedBuild } from '../builds';
import { createKit, type Kit } from './kit';
import { buildPC } from './pc';

export { modelSignature } from './registry';

export interface PcModel { group: THREE.Group; kit: Kit }

/** Builds the full PC model with a fresh kit. Defaults to the Default build. */
export function buildPcModel(resolved: ResolvedBuild = resolveBuild(DEFAULT_BUILD)): PcModel {
  const kit = createKit();
  const group = buildPC(kit, resolved);
  return { group, kit };
}
