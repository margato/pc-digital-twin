import type * as THREE from 'three';
import type { Kit } from '../kit';
import { makeTextures } from '../textures';

/** Values several part builders need: case dimensions (mm) and the procedural textures. */
export interface Shared {
  /** Case depth, height, width and panel thickness; fy = foot height (floor of the case interior). */
  D: number; H: number; W: number; t: number; fy: number;
  /** Mid-height and height of the case side panels. */
  hy: number; hh: number;
  perfTex: THREE.CanvasTexture;
  finTex: THREE.CanvasTexture;
  boardTex: THREE.CanvasTexture;
  radTex: THREE.CanvasTexture;
}

export function createShared(kit: Kit): Shared {
  const { perfTex, finTex, boardTex, radTex } = makeTextures(kit.canvasTex);
  const D = 480, H = 505, W = 230, t = 3, fy = 12;
  const hy = fy + (H - fy) / 2, hh = H - fy;
  return { D, H, W, t, fy, hy, hh, perfTex, finTex, boardTex, radTex };
}
