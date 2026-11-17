/** Starting values for the settings, guessed from the browser and the device. A value the user saved always wins over these. */

/** Weekly play time assumed until the user sets their own. */
export const DEFAULT_PLAY_HOURS = 20;

/** What the guess reads; passed in so tests do not depend on the machine running them. */
export interface Env {
  languages: readonly string[];
  hardwareConcurrency?: number;
  /** Approximate RAM in GB (Chromium only). */
  deviceMemory?: number;
  /** Touch-first device (phone or tablet). */
  coarsePointer?: boolean;
}

const EURO_REGIONS = ['AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK'];
const REGION_CURRENCY: Record<string, string> = {
  BR: 'BRL', US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD', MX: 'MXN', AR: 'ARS', CL: 'CLP', CO: 'COP', JP: 'JPY', IN: 'INR', CH: 'CHF'
};
/** Typical household electricity price per kWh in each currency. A rough starting point, not a quote. */
const KWH_PRICE: Record<string, number> = {
  BRL: 0.95, USD: 0.17, EUR: 0.28, GBP: 0.27, CAD: 0.13, AUD: 0.3, MXN: 2.5, ARS: 60, CLP: 160, COP: 700, JPY: 31, INR: 8, CHF: 0.27
};
const FALLBACK_CURRENCY = 'USD';

/** Region of the first language the browser reports; a bare "pt" or "en" is completed to its likely region (BR, US). */
export function regionOf(languages: readonly string[]): string | null {
  for (const tag of languages) {
    try {
      const loc = new Intl.Locale(tag);
      const region = loc.region ?? loc.maximize().region;
      if (region) return region.toUpperCase();
    } catch {
      /* not a valid language tag: try the next one */
    }
  }
  return null;
}

export function defaultCurrency(env: Env): string {
  const region = regionOf(env.languages);
  if (!region) return FALLBACK_CURRENCY;
  return EURO_REGIONS.includes(region) ? 'EUR' : (REGION_CURRENCY[region] ?? FALLBACK_CURRENCY);
}

export const defaultKwhPrice = (currency: string): number => KWH_PRICE[currency] ?? KWH_PRICE[FALLBACK_CURRENCY];

/** Touch devices and modest hardware get a frame cap to save battery and heat; a desktop starts unlimited. */
export function defaultFpsLimit(env: Env): number | null {
  if (env.coarsePointer) return 30;
  const cores = env.hardwareConcurrency;
  const mem = env.deviceMemory;
  if ((cores !== undefined && cores <= 4) || (mem !== undefined && mem <= 4)) return 60;
  return null;
}

/** The environment of the running browser; empty when there is no `navigator` (tests, SSR). */
export function browserEnv(): Env {
  if (typeof navigator === 'undefined') return { languages: [] };
  const nav = navigator as Navigator & { deviceMemory?: number };
  const languages = nav.languages?.length ? nav.languages : nav.language ? [nav.language] : [];
  let coarsePointer = false;
  try {
    coarsePointer = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  } catch {
    /* matchMedia unavailable */
  }
  return { languages, hardwareConcurrency: nav.hardwareConcurrency, deviceMemory: nav.deviceMemory, coarsePointer };
}

export function detectDefaults(env: Env = browserEnv()) {
  const currency = defaultCurrency(env);
  return { fpsLimit: defaultFpsLimit(env), currency, kwhPrice: defaultKwhPrice(currency) };
}
