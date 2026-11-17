import { describe, expect, it } from 'vitest';
import { defaultCurrency, defaultFpsLimit, defaultKwhPrice, detectDefaults, regionOf } from './defaults';

describe('regionOf', () => {
  it('reads the region of the first language', () => {
    expect(regionOf(['pt-BR', 'en-US'])).toBe('BR');
    expect(regionOf(['en-GB'])).toBe('GB');
  });
  it('completes a bare language to its likely region', () => {
    expect(regionOf(['pt'])).toBe('BR');
    expect(regionOf(['en'])).toBe('US');
  });
  it('skips invalid tags and returns null when nothing is usable', () => {
    expect(regionOf(['???', 'de-DE'])).toBe('DE');
    expect(regionOf([])).toBeNull();
  });
});

describe('defaultCurrency', () => {
  it('follows the region', () => {
    expect(defaultCurrency({ languages: ['pt-BR'] })).toBe('BRL');
    expect(defaultCurrency({ languages: ['en-US'] })).toBe('USD');
    expect(defaultCurrency({ languages: ['en-GB'] })).toBe('GBP');
    expect(defaultCurrency({ languages: ['pt-PT'] })).toBe('EUR');
    expect(defaultCurrency({ languages: ['de-DE'] })).toBe('EUR');
  });
  it('falls back to USD', () => {
    expect(defaultCurrency({ languages: [] })).toBe('USD');
    expect(defaultCurrency({ languages: ['sw-KE'] })).toBe('USD');
  });
});

describe('defaultKwhPrice', () => {
  it('has a price for each known currency and a fallback for the rest', () => {
    expect(defaultKwhPrice('BRL')).toBeGreaterThan(0);
    expect(defaultKwhPrice('XXX')).toBe(defaultKwhPrice('USD'));
  });
});

describe('defaultFpsLimit', () => {
  it('caps touch devices at 30', () => {
    expect(defaultFpsLimit({ languages: [], coarsePointer: true, hardwareConcurrency: 16 })).toBe(30);
  });
  it('caps modest hardware at 60', () => {
    expect(defaultFpsLimit({ languages: [], hardwareConcurrency: 4 })).toBe(60);
    expect(defaultFpsLimit({ languages: [], deviceMemory: 4 })).toBe(60);
  });
  it('leaves a capable desktop unlimited', () => {
    expect(defaultFpsLimit({ languages: [], hardwareConcurrency: 12, deviceMemory: 8 })).toBeNull();
    expect(defaultFpsLimit({ languages: [] })).toBeNull();
  });
});

describe('detectDefaults', () => {
  it('combines the guesses, with a price that matches the currency', () => {
    const d = detectDefaults({ languages: ['pt-BR'], hardwareConcurrency: 12 });
    expect(d).toEqual({ fpsLimit: null, currency: 'BRL', kwhPrice: defaultKwhPrice('BRL') });
  });
});
