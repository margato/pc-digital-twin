import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const KEY = 'pcdt.home.v1';

/** A localStorage stand-in; the store reads it when the module loads, so each test re-imports the module. */
function stubStorage(initial?: string) {
  const data = new Map<string, string>();
  if (initial !== undefined) data.set(KEY, initial);
  vi.stubGlobal('localStorage', { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) });
  return data;
}
const load = async () => (await import('./home')).useHome;

beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllGlobals());

describe('home store', () => {
  it('starts from a regional guess with a TV and a router', async () => {
    stubStorage();
    const { home } = (await load()).getState();
    expect(home.volts).toBeGreaterThan(0);
    expect(home.devices.length).toBe(2);
  });
  it('loads a saved home and ignores a corrupt one', async () => {
    stubStorage(JSON.stringify({ volts: 220, amps: 16, devices: [{ id: 'm', name: 'Monitor', watts: 40 }] }));
    const h = (await load()).getState().home;
    expect([h.volts, h.amps, h.devices.length]).toEqual([220, 16, 1]);
    vi.resetModules();
    stubStorage('{nope');
    expect((await load()).getState().home.devices.length).toBe(2);
  });
  it('setOutlet clamps and persists', async () => {
    const data = stubStorage();
    const s = await load();
    s.getState().setOutlet({ volts: 9999, amps: 16 });
    expect(s.getState().home.volts).toBe(400);
    expect(JSON.parse(data.get(KEY)!).amps).toBe(16);
  });
  it('adds, updates and removes devices, and stops at the limit', async () => {
    stubStorage();
    const s = await load();
    const id = s.getState().addDevice({ name: 'Monitor', watts: 40 });
    expect(id).toBeTruthy();
    s.getState().updateDevice(id!, { watts: 55, idleWatts: 8 });
    const d = s.getState().home.devices.find((x) => x.id === id)!;
    expect([d.name, d.watts, d.idleWatts]).toEqual(['Monitor', 55, 8]);
    s.getState().removeDevice(id!);
    expect(s.getState().home.devices.some((x) => x.id === id)).toBe(false);
    while (s.getState().addDevice()) { /* fill the list */ }
    expect(s.getState().home.devices.length).toBe(12);
    expect(s.getState().addDevice()).toBeNull();
  });
  it('isDefaultHome is true until something changes, and again after a reset', async () => {
    stubStorage();
    const mod = await import('./home');
    const s = mod.useHome;
    expect(mod.isDefaultHome(s.getState().home)).toBe(true);
    s.getState().setOutlet({ amps: 16 });
    expect(mod.isDefaultHome(s.getState().home)).toBe(false);
    s.getState().reset();
    expect(mod.isDefaultHome(s.getState().home)).toBe(true);
  });
  it('reset goes back to the guess', async () => {
    stubStorage();
    const s = await load();
    s.getState().removeDevice(s.getState().home.devices[0].id);
    s.getState().reset();
    expect(s.getState().home.devices.length).toBe(2);
  });
});
