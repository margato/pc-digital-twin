import { describe, expect, it } from 'vitest';
import { defaultHome, FALLBACK_HOME } from '../catalog/home';
import { deviceW, devicesW, MAX_DEVICES, outletSafeW, outletW, sanitizeHome } from './home';

describe('home spec', () => {
  it('defaults follow the region: voltage, outlet rating, a TV and a router', () => {
    const br = defaultHome('BR');
    expect([br.volts, br.amps]).toEqual([127, 10]);
    expect(br.devices.map((d) => d.name)).toEqual(['TV', 'Router']);
    expect(defaultHome('US').volts).toBe(120);
    expect(defaultHome('DE').volts).toBe(230);
    expect(defaultHome(null).amps).toBe(10);
  });

  it('computes capacity and the continuous limit', () => {
    expect(outletW(FALLBACK_HOME)).toBe(1270);
    expect(outletSafeW(FALLBACK_HOME)).toBeCloseTo(1016);
  });

  it('adds up the other devices per scenario, with idle watts only when given', () => {
    const [tv, router] = FALLBACK_HOME.devices;
    expect(deviceW(tv, 'gaming')).toBe(150);
    expect(deviceW(tv, 'idle')).toBe(75);
    expect(deviceW(router, 'idle')).toBe(12);
    expect(devicesW(FALLBACK_HOME, 'stress')).toBe(162);
    expect(devicesW(FALLBACK_HOME, 'idle')).toBe(87);
  });

  describe('sanitizeHome', () => {
    it('returns the fallback for anything that is not an object', () => {
      expect(sanitizeHome(null, FALLBACK_HOME)).toBe(FALLBACK_HOME);
      expect(sanitizeHome('x', FALLBACK_HOME)).toBe(FALLBACK_HOME);
    });
    it('clamps numbers and keeps the fallback for unusable ones', () => {
      const h = sanitizeHome({ volts: 9999, amps: -4, safeFraction: 3, devices: [] }, FALLBACK_HOME);
      expect(h.volts).toBe(400);
      expect(h.amps).toBe(FALLBACK_HOME.amps);
      expect(h.safeFraction).toBe(1);
      expect(h.devices).toEqual([]);
    });
    it('drops broken devices, trims names and caps the list', () => {
      const devices = [{ id: 'a', name: '  Monitor ', watts: 40 }, { name: 'bad' }, null, { id: 'c', name: 'x', watts: -5 }];
      const h = sanitizeHome({ devices }, FALLBACK_HOME);
      expect(h.devices.map((d) => [d.name, d.watts])).toEqual([['Monitor', 40], ['x', 0]]);
      const many = Array.from({ length: 30 }, (_, i) => ({ id: `d${i}`, name: 'n', watts: 1 }));
      expect(sanitizeHome({ devices: many }, FALLBACK_HOME).devices).toHaveLength(MAX_DEVICES);
    });
  });
});
