import type * as THREE from 'three';
import type { ResolvedBuild } from '../builds';
import type { PartId } from '../data/parts';
import type { Kit } from './kit';
import type { Shared } from './parts/shared';
import { buildCase } from './parts/case';
import { buildBoard } from './parts/board';
import { buildCooler } from './parts/cooler';
import { buildRam } from './parts/ram';
import { buildGpu } from './parts/gpu';
import { buildSsd } from './parts/ssd';
import { buildPsu } from './parts/psu';
import { buildCpu } from './cpu/cpu';

/** Builds one component's geometry into the case group. Components that need nothing shared ignore the third argument. */
export type ModelBuilder = (kit: Kit, g: THREE.Group, shared: Shared) => void;

/** The detailed procedural models, by the name spec sheets use in `model.builder`. */
const BUILDERS = {
  'case-nzxt-h7': buildCase,
  'board-tuf-z690': buildBoard,
  'cpu-i7-12700k': buildCpu,
  'cooler-pl360-flux': buildCooler,
  'ram-fury-renegade': buildRam,
  'gpu-asus-prime-5080': buildGpu,
  'ssd-kc3000': buildSsd,
  'psu-xpg-core-reactor': buildPsu
} as const satisfies Record<string, ModelBuilder>;

export type BuilderName = keyof typeof BUILDERS;

/** Used for every `generic-*` builder (and unknown names) until parametric or free-GLB models exist: the closest detailed model of that kind. */
const FALLBACK: Record<PartId, BuilderName> = {
  case: 'case-nzxt-h7', board: 'board-tuf-z690', cpu: 'cpu-i7-12700k', cooler: 'cooler-pl360-flux',
  ram: 'ram-fury-renegade', gpu: 'gpu-asus-prime-5080', ssd: 'ssd-kc3000', psu: 'psu-xpg-core-reactor'
};

/** The model name that will actually be drawn for a part: the sheet's builder if it exists, else the kind's fallback. */
export function builderName(kind: PartId, requested: string): BuilderName {
  return requested in BUILDERS ? (requested as BuilderName) : FALLBACK[kind];
}

export function builderFor(kind: PartId, requested: string): ModelBuilder {
  return BUILDERS[builderName(kind, requested)];
}

/** Build order: later parts draw over earlier ones, so it matches the order the scene was always assembled in. */
export const BUILD_ORDER: readonly PartId[] = ['case', 'board', 'cpu', 'cooler', 'ram', 'gpu', 'ssd', 'psu'];

/** Requested builder name of each part in a resolved build (memory and drives use their first sheet). */
export function requestedBuilders(r: ResolvedBuild): Record<PartId, string> {
  return {
    case: r.case.model.builder, board: r.board.model.builder, cpu: r.cpu.model.builder, cooler: r.cooler.model.builder,
    ram: r.ram[0].spec.model.builder, gpu: r.gpu.model.builder, ssd: r.ssd[0].spec.model.builder, psu: r.psu.model.builder
  };
}

/** Changes only when the drawn models change, so switching between builds that map to the same models does not rebuild the scene. */
export function modelSignature(r: ResolvedBuild): string {
  const req = requestedBuilders(r);
  return BUILD_ORDER.map((id) => builderName(id, req[id])).join('|');
}
