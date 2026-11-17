import type { MemType, PcieGen, SpecBase } from './base';

export interface BoardSpec extends SpecBase {
  kind: 'board';
  chipset: string;
  socket: string;
  formFactor: 'ATX' | 'mATX' | 'ITX' | 'E-ATX';
  memType: MemType;
  ramSlots: number;
  maxRamGB: number;
  m2Slots: number;
  /** Fastest PCIe generation the M.2 slots support. */
  m2Gen: PcieGen;
  pcieX16Gen: PcieGen;
  /** Typical board draw, W (estimate). */
  powerW: number;
}
