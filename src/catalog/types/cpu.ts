import type { MemType, SpecBase } from './base';

export interface CpuSpec extends SpecBase {
  kind: 'cpu';
  socket: string;
  cores: number;
  threads: number;
  baseClockGHz: number;
  boostClockGHz: number;
  /** Peak package power, W (PL2 / max turbo power). */
  maxPowerW: number;
  /** Architecture generation, when BIOS checks care (Intel 12/13/14). */
  gen?: number;
  memTypes: MemType[];
  /** Maximum supported memory, GB. */
  maxRamGB: number;
  /** Runs at the edge of a 360 mm AIO under full load. */
  runsHot?: boolean;
}
