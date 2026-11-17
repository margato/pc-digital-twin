import type { PartId } from '../../data/parts';
import type { LocalizedText } from '../../i18n/types';

/** One line of a build: which spec sheet, and how many. */
export interface BuildItem { spec: string; qty: number }

/** A what-if change on top of a build: spec ids to swap in. Anything left out stays as in the build. */
export interface Swap {
  gpu?: string;
  cpu?: string;
  board?: string;
  psu?: string;
  /** Replaces all memory modules. */
  ram?: BuildItem;
  /** Adds one more drive next to the existing ones. */
  addSsd?: string;
}

/** An upgrade suggestion shown in the Upgrades section; `swap` is what "Try in What if" applies. */
export interface BuildUpgrade {
  rank: number;
  /** Text fields are a string or one string per language; show them with `localize()` from i18n. */
  title: LocalizedText;
  /** Priority label, e.g. 'High', 'Not needed'. */
  priority: LocalizedText;
  cls: 'p-hi' | 'p-md' | 'p-lo' | 'p-no';
  impact: LocalizedText;
  cost: LocalizedText;
  effort: LocalizedText;
  why: LocalizedText;
  swap?: Swap;
  /** Opens the airflow simulation instead. */
  air?: boolean;
}

/** A user's PC: spec ids only. Everything else (names, dims, models, power) is looked up in the catalog. */
export interface Build {
  /** Format version of this JSON, for import/export. */
  version: 1;
  id: string;
  name: string;
  description?: LocalizedText;
  /** Exactly one cpu, gpu, board, psu, cooler and case; one or more ram modules (qty) and drives. */
  parts: Record<PartId, BuildItem[]>;
  /** Only the Default build ships suggestions; custom builds leave this out. */
  upgrades?: BuildUpgrade[];
  upgradesNote?: LocalizedText;
}
