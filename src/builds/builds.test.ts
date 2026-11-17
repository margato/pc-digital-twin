import { beforeEach, describe, expect, it } from 'vitest';
import type { Build } from '../catalog';
import { localize } from '../i18n';
import { applySwap, DEFAULT_BUILD, DEFAULT_ID, MemoryStore, ramTotalGB, resolveBuild, StorageBuildRepository, STORAGE_KEYS, validateBuild } from './index';

const clone = (b: Build): Build => JSON.parse(JSON.stringify(b));
const mine = (id = 'mine'): Build => ({ ...clone(DEFAULT_BUILD), id, name: 'My PC', upgrades: undefined });

describe('default build', () => {
  it('is valid and resolves to the author\'s parts', () => {
    expect(validateBuild(DEFAULT_BUILD).ok).toBe(true);
    const r = resolveBuild(DEFAULT_BUILD);
    expect([r.cpu.name, r.board.chipset, r.psu.wattage, r.case.name]).toEqual([r.cpu.name, 'Z690', 850, 'H7']);
    expect(ramTotalGB(r)).toBe(32);
  });
  it('only references upgrades that exist in the catalog', () => {
    for (const u of DEFAULT_BUILD.upgrades ?? []) {
      const swapped = applySwap(DEFAULT_BUILD, u.swap ?? {});
      expect(validateBuild(swapped).ok, localize(u.title)).toBe(true);
    }
  });
});

describe('validateBuild', () => {
  it('rejects non-objects, wrong versions and missing names', () => {
    expect(validateBuild(null).ok).toBe(false);
    expect(validateBuild({ ...mine(), version: 2 }).ok).toBe(false);
    expect(validateBuild({ ...mine(), name: ' ' }).ok).toBe(false);
  });
  it('rejects unknown specs, wrong kinds and bad quantities', () => {
    const b = mine();
    b.parts.cpu = [{ spec: 'nope', qty: 1 }];
    expect(validateBuild(b)).toMatchObject({ ok: false, errors: [expect.stringContaining('unknown part')] });
    const c = mine();
    c.parts.gpu = [{ spec: DEFAULT_BUILD.parts.cpu[0].spec, qty: 1 }];
    expect(validateBuild(c).ok).toBe(false);
    const d = mine();
    d.parts.ram = [{ spec: d.parts.ram[0].spec, qty: 0 }];
    expect(validateBuild(d).ok).toBe(false);
  });
  it('requires exactly one cpu and at least one drive', () => {
    const b = mine();
    b.parts.cpu = [...b.parts.cpu, ...b.parts.cpu];
    expect(validateBuild(b).ok).toBe(false);
    const c = mine();
    c.parts.ssd = [];
    expect(validateBuild(c).ok).toBe(false);
  });
});

describe('applySwap', () => {
  it('replaces single parts and memory, appends a drive, and leaves the original alone', () => {
    const before = JSON.stringify(DEFAULT_BUILD);
    const b = applySwap(DEFAULT_BUILD, { gpu: 'gpu-nvidia-rtx-5090', ram: { spec: 'ram-generic-16gb-ddr4-3600', qty: 2 }, addSsd: 'ssd-generic-2tb-gen4' });
    expect(b.parts.gpu).toEqual([{ spec: 'gpu-nvidia-rtx-5090', qty: 1 }]);
    expect(b.parts.ram).toEqual([{ spec: 'ram-generic-16gb-ddr4-3600', qty: 2 }]);
    expect(b.parts.ssd).toHaveLength(2);
    expect(JSON.stringify(DEFAULT_BUILD)).toBe(before);
  });
});

describe('StorageBuildRepository', () => {
  let store: MemoryStore;
  let repo: StorageBuildRepository;
  beforeEach(() => {
    store = new MemoryStore();
    repo = new StorageBuildRepository(store);
  });

  it('starts with only the default build, active', () => {
    expect(repo.list().map((b) => b.id)).toEqual([DEFAULT_ID]);
    expect(repo.getActiveId()).toBe(DEFAULT_ID);
    expect(repo.hasOnboarded()).toBe(false);
  });
  it('never writes the default to storage and refuses to change or delete it', () => {
    expect(() => repo.save({ ...mine(), id: DEFAULT_ID })).toThrow();
    expect(() => repo.remove(DEFAULT_ID)).toThrow();
    expect(store.getItem(STORAGE_KEYS.builds)).toBeNull();
  });
  it('saves, replaces and persists across instances', () => {
    repo.save(mine('a'));
    repo.save({ ...mine('a'), name: 'Renamed' });
    repo.save(mine('b'));
    repo.setActiveId('b');
    const again = new StorageBuildRepository(store);
    expect(again.list().map((b) => b.id)).toEqual([DEFAULT_ID, 'a', 'b']);
    expect(again.get('a')?.name).toBe('Renamed');
    expect(again.getActiveId()).toBe('b');
  });
  it('rejects invalid builds', () => {
    const bad = mine();
    bad.parts.cpu = [{ spec: 'nope', qty: 1 }];
    expect(() => repo.save(bad)).toThrow();
  });
  it('falls back to the default when the active build is removed', () => {
    repo.save(mine('a'));
    repo.setActiveId('a');
    repo.remove('a');
    expect(repo.getActiveId()).toBe(DEFAULT_ID);
  });
  it('reset deletes user builds, keeps the onboarding flag', () => {
    repo.save(mine('a'));
    repo.setActiveId('a');
    repo.markOnboarded();
    repo.reset();
    expect(repo.list().map((b) => b.id)).toEqual([DEFAULT_ID]);
    expect(repo.getActiveId()).toBe(DEFAULT_ID);
    expect(new StorageBuildRepository(store).hasOnboarded()).toBe(true);
  });
  it('drops corrupt or broken stored builds instead of crashing', () => {
    const broken = mine('broken');
    broken.parts.gpu = [{ spec: 'removed-from-catalog', qty: 1 }];
    store.setItem(STORAGE_KEYS.builds, JSON.stringify([mine('ok'), broken, { junk: true }, { ...mine(), id: DEFAULT_ID }]));
    expect(new StorageBuildRepository(store).list().map((b) => b.id)).toEqual([DEFAULT_ID, 'ok']);
    store.setItem(STORAGE_KEYS.builds, '{not json');
    expect(new StorageBuildRepository(store).list()).toHaveLength(1);
  });
  it('keeps working when storage throws', () => {
    const throwing = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); }, removeItem: () => { throw new Error('blocked'); } };
    const r = new StorageBuildRepository(throwing);
    r.save(mine('a'));
    expect(r.get('a')).toBeDefined();
  });
});
