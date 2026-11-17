import type { PartId } from '../data/parts';
import type { PartSpec, SpecOf } from './types';
import { CPUS } from './parts/cpu';
import { GPUS } from './parts/gpu';
import { BOARDS } from './parts/board';
import { RAMS } from './parts/ram';
import { SSDS } from './parts/ssd';
import { PSUS } from './parts/psu';
import { COOLERS } from './parts/cooler';
import { CASES } from './parts/case';

export * from './types';
export { displayName } from './display';

/** Every spec sheet, grouped by kind. */
export const CATALOG: { [K in PartId]: SpecOf<K>[] } = {
  cpu: CPUS, gpu: GPUS, board: BOARDS, ram: RAMS, ssd: SSDS, psu: PSUS, cooler: COOLERS, case: CASES
};

const BY_ID = new Map<string, PartSpec>(
  (Object.values(CATALOG) as PartSpec[][]).flat().map((s) => [s.id, s])
);

export function findSpec(id: string): PartSpec | undefined {
  return BY_ID.get(id);
}

/** Like findSpec, but throws unless the sheet exists and is of the expected kind. */
export function getSpec<K extends PartId>(kind: K, id: string): SpecOf<K> {
  const s = BY_ID.get(id);
  if (!s || s.kind !== kind) throw new Error(`Unknown ${kind} spec: ${id}`);
  return s as SpecOf<K>;
}

export function specsOf<K extends PartId>(kind: K): SpecOf<K>[] {
  return CATALOG[kind];
}
