import { DEFAULT_BUILD, ramWatts, resolveBuild, ssdWatts, type ResolvedBuild } from '../builds';
import { SCEN, SCEN_IDS, type PowerBreakdown, type Scenario, type ScenarioId } from '../data/scenarios';

type Rated = Omit<PowerBreakdown, 'rgb'>;

/** Rated draw per subsystem, straight from the spec sheets. */
function rated(r: ResolvedBuild): Rated {
  return { cpu: r.cpu.maxPowerW, gpu: r.gpu.powerW, board: r.board.powerW, ram: ramWatts(r), ssd: ssdWatts(r), cool: r.cooler.powerW };
}

const REFERENCE = rated(resolveBuild(DEFAULT_BUILD));
const RATED_KEYS = Object.keys(REFERENCE) as (keyof Rated)[];

/**
 * Idle / Gaming / Stress for a build. `SCEN` in data/scenarios.ts holds the estimates measured against the Default build;
 * each subsystem's watts scale with the ratio of this build's rated power to the Default's, so the Default reproduces
 * `SCEN` exactly and a stronger GPU or more memory modules draw proportionally more. Temperatures, fan speed and TV
 * draw are not scaled: they stay the same estimates for every build.
 */
export function scenariosFor(r: ResolvedBuild): Record<ScenarioId, Scenario> {
  const mine = rated(r);
  const out = {} as Record<ScenarioId, Scenario>;
  for (const id of SCEN_IDS) {
    const w = { ...SCEN[id].w };
    for (const k of RATED_KEYS) w[k] = Math.round(SCEN[id].w[k] * (mine[k] / REFERENCE[k]));
    out[id] = { ...SCEN[id], w };
  }
  return out;
}
