import type { PartId } from '../data/parts';
import { getSpec, type BoardSpec, type Build, type CaseSpec, type CoolerSpec, type CpuSpec, type GpuSpec, type PsuSpec, type RamSpec, type SsdSpec } from '../catalog';

export interface Counted<T> { spec: T; qty: number }

/** A build with every spec id looked up in the catalog. Single parts are plain specs; memory and drives carry quantities. */
export interface ResolvedBuild {
  build: Build;
  cpu: CpuSpec;
  gpu: GpuSpec;
  board: BoardSpec;
  psu: PsuSpec;
  cooler: CoolerSpec;
  case: CaseSpec;
  ram: Counted<RamSpec>[];
  ssd: Counted<SsdSpec>[];
}

/** Part kinds that hold exactly one spec. */
export const SINGLE_KINDS = ['cpu', 'gpu', 'board', 'psu', 'cooler', 'case'] as const satisfies readonly PartId[];

/** Throws if the build is not valid against the catalog; use `validateBuild` first for untrusted input. */
export function resolveBuild(build: Build): ResolvedBuild {
  const one = <K extends (typeof SINGLE_KINDS)[number]>(kind: K) => getSpec(kind, build.parts[kind][0].spec);
  const many = <K extends 'ram' | 'ssd'>(kind: K) => build.parts[kind].map((i) => ({ spec: getSpec(kind, i.spec), qty: i.qty }));
  return {
    build,
    cpu: one('cpu'), gpu: one('gpu'), board: one('board'), psu: one('psu'), cooler: one('cooler'), case: one('case'),
    ram: many('ram'), ssd: many('ssd')
  };
}

export const ramModules = (r: ResolvedBuild) => r.ram.reduce((n, i) => n + i.qty, 0);
export const ramTotalGB = (r: ResolvedBuild) => r.ram.reduce((n, i) => n + i.qty * i.spec.moduleGB, 0);
export const ramWatts = (r: ResolvedBuild) => r.ram.reduce((n, i) => n + i.qty * i.spec.powerW, 0);
export const ssdCount = (r: ResolvedBuild) => r.ssd.reduce((n, i) => n + i.qty, 0);
export const ssdWatts = (r: ResolvedBuild) => r.ssd.reduce((n, i) => n + i.qty * i.spec.powerW, 0);
