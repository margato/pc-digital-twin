import type { SpecBase } from './base';

export type GpuConnector = '12V-2x6' | '8-pin';

export interface GpuSpec extends SpecBase {
  kind: 'gpu';
  chip: string;
  vramGB: number;
  vramType: string;
  lengthMm: number;
  /** Expansion slots occupied (2.5, 3, 3.5). */
  slots: number;
  /** Total board power, W. */
  powerW: number;
  connector: GpuConnector;
  /** Maker's recommended PSU wattage. */
  recommendedPsuW: number;
  boostClockMHz?: number;
  fanCount?: number;
}
