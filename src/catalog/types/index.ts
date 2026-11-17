import type { PartId } from '../../data/parts';
import type { CpuSpec } from './cpu';
import type { GpuSpec } from './gpu';
import type { BoardSpec } from './board';
import type { RamSpec } from './ram';
import type { SsdSpec } from './ssd';
import type { PsuSpec } from './psu';
import type { CoolerSpec } from './cooler';
import type { CaseSpec } from './case';

export * from './base';
export * from './cpu';
export * from './gpu';
export * from './board';
export * from './ram';
export * from './ssd';
export * from './psu';
export * from './cooler';
export * from './case';
export * from './build';
export * from './home';

export type PartSpec = CpuSpec | GpuSpec | BoardSpec | RamSpec | SsdSpec | PsuSpec | CoolerSpec | CaseSpec;
export type SpecOf<K extends PartId> = Extract<PartSpec, { kind: K }>;
