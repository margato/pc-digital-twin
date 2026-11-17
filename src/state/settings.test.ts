import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const KEY = 'pc-twin-settings';

/** A localStorage stand-in; the store reads it when the module loads, so each test re-imports the module. */
function stubStorage(initial?: string) {
  const data = new Map<string, string>();
  if (initial !== undefined) data.set(KEY, initial);
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v)
  });
  return data;
}
const load = async () => (await import('./settings')).useSettings;

beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllGlobals());

describe('settings store', () => {
  it('has defaults when nothing is stored', async () => {
    stubStorage();
    const s = (await load()).getState();
    expect(s.fpsLimit).toBeNull();
    expect(s.kwhPrice).toBeGreaterThan(0);
    expect(s.currency).toMatch(/^[A-Z]{3}$/);
  });
  it('loads an old stored shape (fpsLimit only) with the new defaults', async () => {
    stubStorage(JSON.stringify({ fpsLimit: 60 }));
    const s = (await load()).getState();
    expect(s.fpsLimit).toBe(60);
    expect(s.kwhPrice).toBeGreaterThan(0);
    expect(s.currency).toMatch(/^[A-Z]{3}$/);
  });
  it('a stored value wins over the default', async () => {
    stubStorage(JSON.stringify({ fpsLimit: 30, kwhPrice: 0.95, currency: 'eur' }));
    const s = (await load()).getState();
    expect(s.kwhPrice).toBe(0.95);
    expect(s.currency).toBe('EUR');
  });
  it('ignores a corrupt stored value', async () => {
    stubStorage('{not json');
    expect((await load()).getState().kwhPrice).toBeGreaterThan(0);
  });
  it('setKwhPrice clamps negative and non-finite values to 0 and persists', async () => {
    const data = stubStorage();
    const store = await load();
    store.getState().setKwhPrice(0.8);
    expect(store.getState().kwhPrice).toBe(0.8);
    store.getState().setKwhPrice(-3);
    expect(store.getState().kwhPrice).toBe(0);
    store.getState().setKwhPrice(NaN);
    expect(store.getState().kwhPrice).toBe(0);
    store.getState().setKwhPrice(Infinity);
    expect(store.getState().kwhPrice).toBe(0);
    store.getState().setKwhPrice(1.25);
    expect(JSON.parse(data.get(KEY)!).kwhPrice).toBe(1.25);
  });
  it('playHours defaults to 20 and setPlayHours clamps to 0-168 and persists', async () => {
    const data = stubStorage();
    const store = await load();
    expect(store.getState().playHours).toBe(20);
    store.getState().setPlayHours(12);
    expect(JSON.parse(data.get(KEY)!).playHours).toBe(12);
    store.getState().setPlayHours(-5);
    expect(store.getState().playHours).toBe(0);
    store.getState().setPlayHours(500);
    expect(store.getState().playHours).toBe(168);
    store.getState().setPlayHours(NaN);
    expect(store.getState().playHours).toBe(0);
  });
  it('setCurrency upper-cases a valid code and ignores an invalid one', async () => {
    stubStorage();
    const store = await load();
    store.getState().setCurrency('usd');
    expect(store.getState().currency).toBe('USD');
    store.getState().setCurrency('dollars');
    expect(store.getState().currency).toBe('USD');
  });
  it('formatMoney formats a currency and falls back on an invalid code', async () => {
    stubStorage();
    const { formatMoney } = await import('./settings');
    expect(formatMoney(12.5, 'USD')).toContain('12.50');
    expect(formatMoney(12.5, 'not-a-code')).toContain('not-a-code');
  });
  it('formatKwhPrice shows two decimals, and a third only when needed', async () => {
    stubStorage();
    const { formatKwhPrice } = await import('./settings');
    expect(formatKwhPrice(0.79, 'USD')).toContain('0.79');
    expect(formatKwhPrice(0.795, 'USD')).toContain('0.795');
    expect(formatKwhPrice(0.7954, 'USD')).toContain('0.795');
  });
});
