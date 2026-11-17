import type { SpecBase } from './base';

export interface CaseSpec extends SpecBase {
  kind: 'case';
  formFactors: string[];
  /** Max GPU length with front fans installed / without, mm. */
  gpuMaxLenMm: number;
  gpuMaxLenNoFrontFansMm: number;
  expansionSlots: number;
  /** Fans installed by the maker. */
  frontFans: number;
  rearFans: number;
  topRadiatorMm?: number;
}
