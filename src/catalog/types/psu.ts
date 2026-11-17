import type { SpecBase } from './base';

export interface PsuSpec extends SpecBase {
  kind: 'psu';
  wattage: number;
  efficiency: '80+ White' | '80+ Bronze' | '80+ Gold' | '80+ Platinum' | '80+ Titanium';
  atx: string;
  native12v2x6: boolean;
  fanMm: number;
}
