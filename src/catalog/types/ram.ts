import type { MemType, SpecBase } from './base';

export interface RamSpec extends SpecBase {
  kind: 'ram';
  memType: MemType;
  /** Capacity of ONE module, GB. */
  moduleGB: number;
  speedMT: number;
  cl: number;
  /** Typical draw of one module, W (estimate). */
  powerW: number;
}
