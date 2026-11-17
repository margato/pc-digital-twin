import { create } from 'zustand';
import { buildRepository, DEFAULT_BUILD, DEFAULT_ID, resolveBuild, type ResolvedBuild } from '../builds';
import type { Build, Swap } from '../catalog';
import { FEATURES } from '../config/features';
import type { PartId } from '../data/parts';
import type { Scenario, ScenarioId } from '../data/scenarios';
import { scenariosFor } from '../sim/scenarios';

export type Section = 'parts' | 'power' | 'upgrades' | 'whatif';

export type CamCmd = 'zoomIn' | 'zoomOut' | 'rotL' | 'rotR';

/** Everything derived from the active build, computed once per switch. */
interface Active {
  build: Build;
  resolved: ResolvedBuild;
  scenarios: Record<ScenarioId, Scenario>;
}

function activate(build: Build): Active {
  const resolved = resolveBuild(build);
  return { build, resolved, scenarios: scenariosFor(resolved) };
}

/** The repository's active build; the default if it is missing or can not be resolved. */
function loadActive(): Active {
  try {
    const build = buildRepository.get(buildRepository.getActiveId());
    if (build) return activate(build);
  } catch {
    /* fall through to the default build */
  }
  return activate(DEFAULT_BUILD);
}

/** Single source of truth shared by the React panel and the 3D scene. */
export interface AppState extends Active {
  /** All saved builds, the default first. */
  builds: Build[];
  /** Isolated part, or null for the whole PC. */
  part: PartId | null;
  scen: ScenarioId;
  section: Section;
  /** What-if: spec ids swapped into the active build. Empty means "same as the build". */
  swap: Swap;
  heatOn: boolean;
  airOn: boolean;
  /** The onboarding wizard (create / import a PC) is open. */
  onboardingOpen: boolean;
  /** Bumped by Reset view, which also returns to the whole PC, Gaming, airflow and heat map off; the camera rig re-frames on it. */
  viewNonce: number;
  /** True once the user orbits or zooms the camera; cleared whenever the rig re-frames. */
  viewDirty: boolean;
  /** Camera button command (zoom/rotate); n changes on every press so repeats are seen. */
  camCmd: { kind: CamCmd; n: number } | null;
  sendCam: (kind: CamCmd) => void;
  setViewDirty: (d: boolean) => void;

  setPart: (p: PartId | null) => void;
  togglePart: (p: PartId) => void;
  setScen: (s: ScenarioId) => void;
  setSection: (s: Section) => void;
  /** Patches the what-if swap. Pass `undefined` for a key to put that part back to the build's own. */
  setSwap: (patch: { [K in keyof Swap]: Swap[K] | undefined }) => void;
  resetSwap: () => void;
  /** Used by "Try in What if": replace the swap and open What-if. */
  tryUpgrade: (swap: Swap) => void;
  setHeat: (on: boolean) => void;
  setAir: (on: boolean) => void;
  resetView: () => void;

  /** Makes a saved build the active one and clears the what-if. */
  selectBuild: (id: string) => void;
  /** Saves (create or replace) a user build and makes it active. */
  saveBuild: (build: Build) => void;
  /** Renames or re-describes the active user build in place; the view, what-if and scenarios stay as they are. No-op for the default build. */
  updateBuild: (patch: { name?: string; description?: string }) => void;
  /** Deletes a user build; the default becomes active if it was. */
  removeBuild: (id: string) => void;
  /** Deletes every user build and goes back to the default. */
  resetBuilds: () => void;
  openOnboarding: () => void;
  /** Closes the wizard and remembers that the user has seen it. */
  closeOnboarding: () => void;
}

/** Fresh view state that goes with a newly activated build. */
const FRESH = { part: null, swap: {}, scen: 'gaming', heatOn: false, airOn: false } as const;

export const useApp = create<AppState>((set, get) => ({
  ...loadActive(),
  builds: buildRepository.list(),
  part: null,
  scen: 'gaming',
  section: 'parts',
  swap: {},
  heatOn: false,
  airOn: false,
  onboardingOpen: FEATURES.onboarding && !buildRepository.hasOnboarded(),
  viewNonce: 0,
  viewDirty: false,
  camCmd: null,
  sendCam: (kind) => set((s) => ({ camCmd: { kind, n: (s.camCmd?.n ?? 0) + 1 } })),
  setViewDirty: (viewDirty) => set((s) => (s.viewDirty === viewDirty ? s : { viewDirty })),

  setPart: (part) => set({ part }),
  togglePart: (p) => set((s) => ({ part: s.part === p ? null : p })),
  setScen: (scen) => set({ scen }),
  setSection: (section) => set({ section }),
  setSwap: (patch) =>
    set((s) => {
      const swap: Swap = { ...s.swap, ...patch };
      for (const k of Object.keys(swap) as (keyof Swap)[]) if (swap[k] === undefined) delete swap[k];
      return { swap };
    }),
  resetSwap: () => set({ swap: {} }),
  tryUpgrade: (swap) => set({ swap: { ...swap }, section: 'whatif' }),
  setHeat: (heatOn) => set({ heatOn }),
  setAir: (airOn) => set({ airOn }),
  resetView: () => set((s) => ({ part: null, scen: 'gaming', airOn: false, heatOn: false, viewDirty: false, viewNonce: s.viewNonce + 1 })),

  selectBuild: (id) => {
    const build = buildRepository.get(id);
    if (!build) return;
    buildRepository.setActiveId(id);
    set((s) => ({ ...activate(build), ...FRESH, viewNonce: s.viewNonce + 1 }));
  },
  saveBuild: (build) => {
    buildRepository.save(build);
    buildRepository.setActiveId(build.id);
    buildRepository.markOnboarded();
    set((s) => ({ ...activate(build), ...FRESH, builds: buildRepository.list(), onboardingOpen: false, section: 'parts', viewNonce: s.viewNonce + 1 }));
  },
  updateBuild: (patch) => {
    const { build } = get();
    if (build.id === DEFAULT_ID) return;
    const next: Build = { ...build, ...patch };
    if (!next.description) delete next.description;
    buildRepository.save(next);
    set({ build: next, builds: buildRepository.list() });
  },
  removeBuild: (id) => {
    buildRepository.remove(id);
    set((s) => {
      const build = buildRepository.get(buildRepository.getActiveId()) ?? DEFAULT_BUILD;
      return { ...(s.build.id === id ? { ...activate(build), ...FRESH } : {}), builds: buildRepository.list() };
    });
  },
  resetBuilds: () => {
    buildRepository.reset();
    set((s) => ({ ...activate(DEFAULT_BUILD), ...FRESH, builds: buildRepository.list(), viewNonce: s.viewNonce + 1 }));
  },
  openOnboarding: () => { if (FEATURES.onboarding) set({ onboardingOpen: true }); },
  closeOnboarding: () => {
    buildRepository.markOnboarded();
    set({ onboardingOpen: false });
  }
}));
