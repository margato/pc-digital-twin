import { describe, expect, it } from 'vitest';
import { DEFAULT_BUILD, resolveBuild } from './index';
import { partRows, ramLimits } from './rows';

describe('partRows and ramLimits for the default build', () => {
  const r = resolveBuild(DEFAULT_BUILD);

  it('lists the eight types in dock order', () => {
    expect(partRows(r).map((row) => row.part)).toEqual(['gpu', 'cpu', 'cooler', 'ram', 'board', 'ssd', 'psu', 'case']);
  });

  it('expands memory to one item per stick, totalling 32 GB', () => {
    const ram = partRows(r).find((row) => row.part === 'ram')!;
    expect(ram.items).toHaveLength(4);
    expect(ram.items.reduce((n, i) => n + (i.gb ?? 0), 0)).toBe(32);
  });

  it('gives the GPU its measured dimensions', () => {
    const gpu = partRows(r).find((row) => row.part === 'gpu')!;
    expect(gpu.items[0].dims).toBe('304 × 126 × 50 mm');
  });

  it('derives memory limits from the board and CPU', () => {
    expect(ramLimits(r)).toMatchObject({ maxGB: 128, slots: 4, perSlotMaxGB: 32 });
  });
});

describe('display names for the Default build', () => {
  it('keep the maker, product line and model people know', () => {
    const names = Object.fromEntries(partRows(resolveBuild(DEFAULT_BUILD)).map((r) => [r.part, r.items[0].name]));
    expect(names).toMatchObject({
      cpu: 'Intel Core i7-12700K',
      gpu: 'ASUS Prime GeForce RTX 5080 OC',
      board: 'ASUS TUF Gaming Z690-Plus D4',
      ram: 'Kingston Fury Renegade',
      case: 'NZXT H7'
    });
  });
});
