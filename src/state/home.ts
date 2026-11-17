import { create } from 'zustand';
import { defaultHome } from '../catalog/home';
import type { HomeDevice, HomeSpec } from '../catalog';
import { MAX_DEVICES, sanitizeHome } from '../sim/home';
import { regionOf, browserEnv } from './defaults';

const KEY = 'pcdt.home.v1';

/** The home for this browser's region, used until the user saves their own. */
const guess = () => defaultHome(regionOf(browserEnv().languages));

/** True when `h` is exactly the regional guess, i.e. there is nothing to reset. */
export const isDefaultHome = (h: HomeSpec) => JSON.stringify(h) === JSON.stringify(guess());

function read(): HomeSpec {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return sanitizeHome(JSON.parse(raw), guess());
  } catch {
    /* storage unavailable or corrupt: use the guess */
  }
  return guess();
}

let counter = 0;
const newId = () => `d${Date.now().toString(36)}${(counter++).toString(36)}`;

interface HomeState {
  home: HomeSpec;
  /** Mains voltage and outlet rating; values are clamped to a sane range. */
  setOutlet: (patch: { volts?: number; amps?: number }) => void;
  /** Adds a device (up to MAX_DEVICES) and returns its id, or null when the list is full. */
  addDevice: (d?: Partial<Omit<HomeDevice, 'id'>>) => string | null;
  updateDevice: (id: string, patch: Partial<Omit<HomeDevice, 'id'>>) => void;
  removeDevice: (id: string) => void;
  /** Back to the guess for this browser's region. */
  reset: () => void;
}

export const useHome = create<HomeState>((set, get) => {
  const commit = (home: HomeSpec) => {
    const clean = sanitizeHome(home, guess());
    set({ home: clean });
    try {
      localStorage.setItem(KEY, JSON.stringify(clean));
    } catch {
      /* storage unavailable */
    }
  };
  return {
    home: read(),
    setOutlet: (patch) => commit({ ...get().home, ...patch }),
    addDevice: (d = {}) => {
      const { home } = get();
      if (home.devices.length >= MAX_DEVICES) return null;
      const id = newId();
      commit({ ...home, devices: [...home.devices, { id, name: d.name ?? '', watts: d.watts ?? 0, ...(d.idleWatts !== undefined && { idleWatts: d.idleWatts }) }] });
      return id;
    },
    updateDevice: (id, patch) => {
      const { home } = get();
      commit({ ...home, devices: home.devices.map((x) => (x.id === id ? { ...x, ...patch } : x)) });
    },
    removeDevice: (id) => {
      const { home } = get();
      commit({ ...home, devices: home.devices.filter((x) => x.id !== id) });
    },
    reset: () => commit(guess())
  };
});
