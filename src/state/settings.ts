import { create } from 'zustand';
import { localeOf } from '../i18n';
import { DEFAULT_PLAY_HOURS, defaultKwhPrice, detectDefaults } from './defaults';

const KEY = 'pc-twin-settings';

interface Stored {
  fpsLimit: number | null;
  kwhPrice: number;
  currency: string;
  /** Hours of play per week, for the electricity cost estimate. */
  playHours: number;
}

export const MAX_PLAY_HOURS = 168;
const safeHours = (v: unknown, fallback = 0) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(MAX_PLAY_HOURS, Math.max(0, v)) : fallback);

/** A price is a finite number >= 0; anything else falls back to `fallback`. */
const safePrice = (v: unknown, fallback = 0) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : fallback);

function read(): Stored {
  const defaults = detectDefaults();
  let raw: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    if (parsed && typeof parsed === 'object') raw = parsed as Record<string, unknown>;
  } catch {
    /* storage unavailable or corrupt: use the defaults */
  }
  const { fpsLimit, kwhPrice, currency, playHours } = raw;
  return {
    // null is a real choice ("unlimited"), so only a missing key falls back to the guess.
    fpsLimit: fpsLimit === null ? null : typeof fpsLimit === 'number' && fpsLimit > 0 ? fpsLimit : defaults.fpsLimit,
    currency: typeof currency === 'string' && /^[A-Za-z]{3}$/.test(currency) ? currency.toUpperCase() : defaults.currency,
    // A saved price stays; without one, the typical price of the (saved or guessed) currency applies.
    playHours: safeHours(playHours, DEFAULT_PLAY_HOURS),
    kwhPrice: safePrice(kwhPrice, defaultKwhPrice(typeof currency === 'string' && /^[A-Za-z]{3}$/.test(currency) ? currency.toUpperCase() : defaults.currency))
  };
}

interface SettingsState extends Stored {
  setFpsLimit: (v: number | null) => void;
  /** Price of one kWh in `currency`; negative or non-finite values become 0. */
  setKwhPrice: (n: number) => void;
  /** ISO 4217 code ("BRL"); an invalid code is ignored. */
  setCurrency: (code: string) => void;
  /** Clamped to 0–168 hours a week; non-finite values become 0. */
  setPlayHours: (n: number) => void;
}

export const useSettings = create<SettingsState>((set, get) => {
  const update = (patch: Partial<Stored>) => {
    set(patch);
    const { fpsLimit, kwhPrice, currency, playHours } = get();
    try {
      localStorage.setItem(KEY, JSON.stringify({ fpsLimit, kwhPrice, currency, playHours }));
    } catch {
      /* storage unavailable */
    }
  };
  return {
    ...read(),
    setFpsLimit: (v) => update({ fpsLimit: v }),
    setKwhPrice: (n) => update({ kwhPrice: safePrice(n) }),
    setPlayHours: (n) => update({ playHours: safeHours(n) }),
    setCurrency: (code) => {
      if (/^[A-Za-z]{3}$/.test(code)) update({ currency: code.toUpperCase() });
    }
  };
});

/** "R$ 12,50" / "$12.50" in the active language; an unknown currency code falls back to the number and the code. */
export function formatMoney(amount: number, currency: string, fractionDigits?: { min?: number; max?: number }): string {
  try {
    return new Intl.NumberFormat(localeOf(), {
      style: 'currency',
      currency,
      ...(fractionDigits?.min !== undefined && { minimumFractionDigits: fractionDigits.min }),
      ...(fractionDigits?.max !== undefined && { maximumFractionDigits: fractionDigits.max })
    }).format(amount);
  } catch {
    return `${amount.toLocaleString(localeOf(), { maximumFractionDigits: fractionDigits?.max ?? 2 })} ${currency}`;
  }
}

/** The price of one kWh: two decimals, a third only when it is not zero (0,79 / 0,795). */
export const formatKwhPrice = (price: number, currency: string) => formatMoney(price, currency, { min: 2, max: 3 });

/** Frames actually drawn (not skipped by the FPS limiter); read by the debug overlay. */
export const renderStats = { frames: 0 };
