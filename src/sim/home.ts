import type { HomeDevice, HomeSpec } from '../catalog';
import type { ScenarioId } from '../data/scenarios';

export const MAX_DEVICES = 12;

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Outlet capacity, W (volts × amps). */
export const outletW = (h: HomeSpec) => h.volts * h.amps;
/** Continuous-load limit of the outlet, W. */
export const outletSafeW = (h: HomeSpec) => outletW(h) * h.safeFraction;

/** Wall draw of one device in a scenario. */
export const deviceW = (d: HomeDevice, scenario: ScenarioId) => (scenario === 'idle' ? (d.idleWatts ?? d.watts) : d.watts);
/** Wall draw of every other device on the outlet in a scenario. */
export const devicesW = (h: HomeSpec, scenario: ScenarioId) => h.devices.reduce((s, d) => s + deviceW(d, scenario), 0);

/** One device from untrusted input, or null when it is unusable. */
function sanitizeDevice(raw: unknown, i: number): HomeDevice | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Record<string, unknown>;
  if (!finite(d.watts)) return null;
  const name = typeof d.name === 'string' ? d.name.trim().slice(0, 40) : '';
  const out: HomeDevice = { id: typeof d.id === 'string' && d.id ? d.id : `d${i}`, name, watts: clamp(d.watts, 0, 5000) };
  if (finite(d.idleWatts)) out.idleWatts = clamp(d.idleWatts, 0, 5000);
  return out;
}

/** Makes a stored or edited home safe to use: numbers are clamped to sane ranges, bad devices dropped, and missing parts come from `fallback`. */
export function sanitizeHome(raw: unknown, fallback: HomeSpec): HomeSpec {
  if (!raw || typeof raw !== 'object') return fallback;
  const h = raw as Record<string, unknown>;
  const devices = Array.isArray(h.devices)
    ? h.devices.map(sanitizeDevice).filter((d): d is HomeDevice => d !== null).slice(0, MAX_DEVICES)
    : fallback.devices;
  return {
    version: 1,
    volts: finite(h.volts) && h.volts > 0 ? clamp(h.volts, 50, 400) : fallback.volts,
    amps: finite(h.amps) && h.amps > 0 ? clamp(h.amps, 1, 100) : fallback.amps,
    safeFraction: finite(h.safeFraction) && h.safeFraction > 0 ? clamp(h.safeFraction, 0.5, 1) : fallback.safeFraction,
    devices
  };
}
