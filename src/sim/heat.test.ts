import { describe, expect, it } from 'vitest';
import { SCEN } from '../data/scenarios';
import { heatRGB, partTemp, SLICE_H, SLICE_W, sliceImage } from './heat';

describe('heatRGB', () => {
  it('returns the end colours and clamps outside the range', () => {
    expect(heatRGB(25)).toEqual([43, 108, 255]);
    expect(heatRGB(-40)).toEqual([43, 108, 255]);
    expect(heatRGB(95)).toEqual([232, 32, 42]);
    expect(heatRGB(200)).toEqual([232, 32, 42]);
  });
  it('hits stops and interpolates between them', () => {
    expect(heatRGB(55)).toEqual([56, 209, 106]);
    const mid = heatRGB(47.5);
    expect(mid[0]).toBeCloseTo((32 + 56) / 2);
    expect(mid[1]).toBeCloseTo((196 + 209) / 2);
    expect(mid[2]).toBeCloseTo((216 + 106) / 2);
  });
  it('is continuous (no jumps between neighbouring temperatures)', () => {
    for (let t = 25; t < 95; t += 0.5) {
      const a = heatRGB(t), b = heatRGB(t + 0.5);
      for (let c = 0; c < 3; c++) expect(Math.abs(a[c] - b[c])).toBeLessThan(20);
    }
  });
  it('gets redder and less blue as temperature rises across the range', () => {
    expect(heatRGB(90)[0]).toBeGreaterThan(heatRGB(30)[0]);
    expect(heatRGB(90)[2]).toBeLessThan(heatRGB(30)[2]);
  });
});

describe('partTemp', () => {
  const T = SCEN.stress.t;
  it('maps parts to sensors', () => {
    expect(partTemp('cpu', T)).toBe(T.cpu);
    expect(partTemp('gpu', T)).toBe(T.gpu);
    expect(partTemp('board', T)).toBe(T.vrm);
    expect(partTemp('ram', T)).toBe(T.ram);
    expect(partTemp('ssd', T)).toBe(T.ssd);
    expect(partTemp('psu', T)).toBe(T.psu);
    expect(partTemp('cooler', T)).toBe(T.rad);
    expect(partTemp('case', T)).toBe(T.air);
  });
  it('falls back to air temperature with no part', () => {
    expect(partTemp(null, T)).toBe(T.air);
    expect(partTemp(undefined, T)).toBe(T.air);
  });
});

describe('sliceImage', () => {
  const img = sliceImage(SCEN.gaming.t);
  it('has RGBA size for SLICE_W x SLICE_H', () => {
    expect(img).toBeInstanceOf(Uint8ClampedArray);
    expect(img.length).toBe(SLICE_W * SLICE_H * 4);
  });
  it('is uniformly 205 alpha', () => {
    for (let i = 3; i < img.length; i += 4) expect(img[i]).toBe(205);
  });
  it('is hotter around the GPU than at the intake side corner', () => {
    // GPU source at x=-84,y=232 -> pixel i,j
    const i = Math.round((-84 + 237) / 474 * SLICE_W), j = Math.round((505 - 232) / 490 * SLICE_H);
    const hot = img[(j * SLICE_W + i) * 4];      // red channel
    const cold = img[(5 * SLICE_W + (SLICE_W - 5)) * 4];
    expect(hot).toBeGreaterThan(cold);
  });
});
