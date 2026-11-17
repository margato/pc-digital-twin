import { describe, it, expect } from 'vitest';
import { CATALOG, findSpec, getSpec } from './index';
import type { PartSpec } from './types';

const all = (Object.values(CATALOG) as PartSpec[][]).flat();

describe('catalog', () => {
  it('has globally unique ids', () => {
    const ids = all.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('files each sheet under its own kind', () => {
    for (const [kind, specs] of Object.entries(CATALOG)) for (const s of specs) expect(s.kind).toBe(kind);
  });

  it('gives every sheet a manufacturer, brand and procedural builder', () => {
    for (const s of all) {
      expect(s.manufacturer, s.id).toBeTruthy();
      expect(s.brand, s.id).toBeTruthy();
      expect(s.model.builder, s.id).toBeTruthy();
    }
  });

  it('only references free licenses for 3D models and images', () => {
    for (const s of all) {
      if (s.model.glb) expect(s.model.glb.sourceUrl, s.id).toMatch(/^https:\/\//);
      if (s.image) {
        expect(s.image.url, s.id).toMatch(/^https:\/\//);
        expect(s.image.sourceUrl, s.id).toMatch(/^https:\/\//);
        expect(s.image.author, s.id).toBeTruthy();
      }
    }
  });

  it('looks sheets up by id and kind', () => {
    const cpu = CATALOG.cpu[0];
    expect(findSpec(cpu.id)).toBe(cpu);
    expect(getSpec('cpu', cpu.id)).toBe(cpu);
    expect(() => getSpec('gpu', cpu.id)).toThrow();
    expect(findSpec('nope')).toBeUndefined();
  });

  it('writes spec sheets one property per line', () => {
    const files = import.meta.glob<string>('./parts/*.ts', { query: '?raw', import: 'default', eager: true });
    for (const [f, text] of Object.entries(files)) {
      text.split('\n').forEach((line, i) => {
        const code = line.replace(/\/\/.*$/, '').replace(/'[^']*'/g, "''");
        expect(/,\s*\w+\s*:/.test(code), `${f}:${i + 1} has several properties on one line`).toBe(false);
      });
    }
  });
});
