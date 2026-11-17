import type { SpecBase } from './base';

export interface CoolerSpec extends SpecBase {
  kind: 'cooler';
  type: 'aio' | 'air';
  /** Radiator length in mm for an AIO (240, 280, 360). */
  radiatorMm?: number;
  fanCount: number;
  fanMm: number;
  /** Typical fan + pump draw at full speed, W (estimate). */
  powerW: number;
  sockets: string[];
}
