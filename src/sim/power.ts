import type { PowerBreakdown } from '../data/scenarios';
import { localeOf } from '../i18n';

export type Level = 'ok' | 'warn' | 'fail';

/** PSU efficiency by load fraction (80 Plus Gold-ish curve, linear between points). */
export function effAt(f: number): number {
  const pts = [[0, 0.78], [0.1, 0.82], [0.2, 0.87], [0.5, 0.905], [1, 0.87], [1.6, 0.84]];
  for (let i = 1; i < pts.length; i++) {
    if (f <= pts[i][0]) {
      const a = pts[i - 1], b = pts[i], k = (f - a[0]) / (b[0] - a[0]);
      return a[1] + (b[1] - a[1]) * k;
    }
  }
  return 0.84;
}

export interface PowerResult { dc: number; load: number; eff: number; wall: number }

export function powerOf(w: PowerBreakdown, cap: number): PowerResult {
  const dc = Object.values(w).reduce((s, v) => s + v, 0);
  const load = dc / cap;
  const eff = effAt(load);
  return { dc, load, eff, wall: dc / eff };
}

export function lvl(v: number, okMax: number, warnMax: number): Level {
  return v <= okMax ? 'ok' : v <= warnMax ? 'warn' : 'fail';
}
export const fmtW = (n: number) => Math.round(n).toLocaleString(localeOf()) + ' W';
export const pct = (n: number) => Math.round(n * 100).toLocaleString(localeOf()) + '%';
/** Energy per hour in kWh from watts (W·h / 1000): two decimals, and a third when it is not zero (0,54 / 0,535). */
export const fmtKwh = (wh: number) => (wh / 1000).toLocaleString(localeOf(), { minimumFractionDigits: 2, maximumFractionDigits: 3 });
