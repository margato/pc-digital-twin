import { describe, expect, it } from 'vitest';
import { SCEN } from '../data/scenarios';
import { effAt, fmtW, lvl, pct, powerOf } from './power';

describe('effAt', () => {
  it('hits the curve points exactly', () => {
    expect(effAt(0)).toBeCloseTo(0.78);
    expect(effAt(0.5)).toBeCloseTo(0.905);
    expect(effAt(1)).toBeCloseTo(0.87);
  });
  it('interpolates linearly between points', () => {
    expect(effAt(0.05)).toBeCloseTo(0.80);
    expect(effAt(0.75)).toBeCloseTo((0.905 + 0.87) / 2);
  });
  it('clamps above the last point', () => {
    expect(effAt(1.6)).toBeCloseTo(0.84);
    expect(effAt(5)).toBe(0.84);
  });
});

describe('powerOf', () => {
  it('sums DC, derives load, efficiency and wall draw', () => {
    const P = powerOf(SCEN.gaming.w, 850);
    expect(P.dc).toBe(482);
    expect(P.load).toBeCloseTo(482 / 850);
    expect(P.eff).toBeCloseTo(effAt(P.load));
    expect(P.wall).toBeCloseTo(P.dc / P.eff);
    expect(P.wall).toBeGreaterThan(P.dc);
  });
});

describe('lvl', () => {
  it('classifies with inclusive upper bounds', () => {
    expect(lvl(0.8, 0.8, 1)).toBe('ok');
    expect(lvl(0.81, 0.8, 1)).toBe('warn');
    expect(lvl(1, 0.8, 1)).toBe('warn');
    expect(lvl(1.01, 0.8, 1)).toBe('fail');
  });
});

describe('formatters', () => {
  it('formats watts and percent', () => {
    expect(fmtW(1269.6)).toBe('1,270 W');
    expect(pct(0.456)).toBe('46%');
  });
});
