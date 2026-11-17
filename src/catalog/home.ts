import type { HomeSpec } from './types';

/** Mains voltage by region; anything not listed gets 230 V. */
const REGION_VOLTS: Record<string, number> = {
  BR: 127, US: 120, CA: 120, MX: 127, JP: 100, CO: 120, CL: 220, AR: 220
};
/** Outlet rating by region (A). */
const REGION_AMPS: Record<string, number> = { BR: 10, US: 15, CA: 15, MX: 15, JP: 15, GB: 13 };

/** A typical home for a region: its mains voltage and outlet rating, a TV and a router. The numbers are placeholders for the user to correct in Settings. */
export function defaultHome(region: string | null): HomeSpec {
  const r = region ?? '';
  return {
    version: 1,
    volts: REGION_VOLTS[r] ?? 230,
    amps: REGION_AMPS[r] ?? 10,
    safeFraction: 0.8,
    devices: [
      { id: 'tv', name: 'TV', watts: 150, idleWatts: 75 },
      { id: 'router', name: 'Router', watts: 12 }
    ]
  };
}

/** The home the tests and the checks fall back on: 127 V × 10 A with a TV and a router, the author's setup. */
export const FALLBACK_HOME: HomeSpec = defaultHome('BR');
