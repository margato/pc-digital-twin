import type { PcieGen, SpecBase } from './base';

export interface SsdSpec extends SpecBase {
  kind: 'ssd';
  capacityGB: number;
  iface: 'NVMe' | 'SATA';
  pcieGen?: PcieGen;
  formFactor: 'M.2 2280' | '2.5"';
  readMBs: number;
  writeMBs: number;
  /** Typical draw under load, W (estimate). */
  powerW: number;
}
