import { ramModules, ramTotalGB, ramWatts, ssdCount, ssdWatts, type ResolvedBuild } from '../builds';
import { FALLBACK_HOME } from '../catalog/home';
import type { HomeSpec } from '../catalog';
import { CONN_W, RGB_W } from '../data/scenarios';
import { devicesW, outletW } from './home';
import type { PowerBreakdown } from '../data/scenarios';
import { t, type MessageKey } from '../i18n';
import { fmtW, lvl, pct, powerOf, type Level, type PowerResult } from './power';

/** Stable English key of each check; its label and texts come from the `checks.<id>.*` messages. */
export type CheckId =
  | 'cpuSocket' | 'bios' | 'cooling' | 'memory' | 'memorySlots' | 'memoryCapacity' | 'platformChange'
  | 'gpuLength' | 'gpuThickness' | 'psuForGpu' | 'gpuPowerCable' | 'storage' | 'psuLoad' | 'wallOutlet';

export interface Check { l: Level; id: CheckId; label: string; text: string }
export interface Evaluation { checks: Check[]; worst: Level; P: PowerResult; outlet: number; cap: number; w: PowerBreakdown }

/** Intel 600-series boards need a BIOS update before a 14th gen CPU. */
const NEEDS_14TH_GEN_BIOS = /^[ZBH]6\d0$/;

/**
 * What-if compatibility and power checks at full stress. `cand` is the build being tried, `base` is the build it is
 * compared against (the active one): "Platform change" and the added-drive check are relative to it.
 * `home` is the user's wall outlet and the other devices on it. Labels and texts are in the active language at the time of the call.
 */
export function evaluate(cand: ResolvedBuild, base: ResolvedBuild, home: HomeSpec = FALLBACK_HOME): Evaluation {
  const { gpu: g, cpu: c, board: b, psu: p, case: cs } = cand;
  const checks: Check[] = [];
  const add = (l: Level, id: CheckId, text: string) => checks.push({ l, id, label: t(`checks.${id}.label` as MessageKey), text });

  if (c.socket !== b.socket) add('fail', 'cpuSocket', t('checks.cpuSocket.text.fail', { cpu: c.name, socket: c.socket, boardSocket: b.socket }));
  else add('ok', 'cpuSocket', t('checks.cpuSocket.text.ok', { socket: c.socket }));
  if (c.socket === 'LGA1700' && c.gen === 14 && NEEDS_14TH_GEN_BIOS.test(b.chipset)) add('warn', 'bios', t('checks.bios.text.warn', { chipset: b.chipset }));
  if (c.runsHot) add('warn', 'cooling', t('checks.cooling.text.warn', { watts: c.maxPowerW }));
  const mem = cand.ram[0].spec.memType;
  if (mem !== b.memType) add('fail', 'memory', t('checks.memory.text.fail', { mem, boardMem: b.memType }));
  else add('ok', 'memory', t('checks.memory.text.ok', { mem }));
  if (ramModules(cand) > b.ramSlots) add('fail', 'memorySlots', t('checks.memorySlots.text.fail', { modules: ramModules(cand), slots: b.ramSlots }));
  const maxGB = Math.min(b.maxRamGB, c.maxRamGB);
  if (ramTotalGB(cand) > maxGB) add('fail', 'memoryCapacity', t('checks.memoryCapacity.text.fail', { total: ramTotalGB(cand), max: maxGB }));
  if (b.id !== base.board.id) add('warn', 'platformChange', t('checks.platformChange.text.warn'));

  const clear = cs.gpuMaxLenMm;
  if (g.lengthMm > clear) add('fail', 'gpuLength', t('checks.gpuLength.text.fail', { len: g.lengthMm, clear }));
  else {
    const fit = { len: g.lengthMm, clear, caseName: cs.name, noFront: cs.gpuMaxLenNoFrontFansMm };
    add(g.lengthMm > clear - 25 ? 'warn' : 'ok', 'gpuLength', t(g.lengthMm >= 335 ? 'checks.gpuLength.text.fitLong' : 'checks.gpuLength.text.fit', fit));
  }
  if (g.slots > 3) add('ok', 'gpuThickness', t('checks.gpuThickness.text.ok', { slots: g.slots, expansion: cs.expansionSlots }));

  if (p.wattage < g.recommendedPsuW) add('fail', 'psuForGpu', t('checks.psuForGpu.text.fail', { rec: g.recommendedPsuW, wattage: p.wattage }));
  else add('ok', 'psuForGpu', t('checks.psuForGpu.text.ok', { rec: g.recommendedPsuW, wattage: p.wattage }));
  if (g.connector === '12V-2x6') {
    if (g.powerW > 500) add('ok', 'gpuPowerCable', t('checks.gpuPowerCable.text.nativeHot', { watts: g.powerW, rating: CONN_W }));
    else add('ok', 'gpuPowerCable', t('checks.gpuPowerCable.text.native'));
  } else add('ok', 'gpuPowerCable', t('checks.gpuPowerCable.text.pcie8'));

  const added = cand.ssd.slice(base.ssd.length);
  if (ssdCount(cand) > b.m2Slots) add('fail', 'storage', t('checks.storage.text.fail', { count: ssdCount(cand), slots: b.m2Slots }));
  else if (added.length) {
    if (added.some((d) => d.spec.pcieGen === 5) && b.m2Gen < 5) add('warn', 'storage', t('checks.storage.text.warn', { chipset: b.chipset, gen: b.m2Gen }));
    else add('ok', 'storage', t('checks.storage.text.ok', { free: b.m2Slots - ssdCount(base) }));
  }

  const w: PowerBreakdown = { cpu: c.maxPowerW, gpu: g.powerW, board: b.powerW, ram: ramWatts(cand), ssd: ssdWatts(cand), cool: cand.cooler.powerW, rgb: RGB_W };
  const P = powerOf(w, p.wattage);
  const outlet = P.wall + devicesW(home, 'stress');
  const pl = lvl(P.load, 0.8, 1);
  add(pl, 'psuLoad', t(pl === 'warn' ? 'checks.psuLoad.text.warn' : pl === 'fail' ? 'checks.psuLoad.text.fail' : 'checks.psuLoad.text.ok',
    { dc: fmtW(P.dc), wattage: p.wattage, load: pct(P.load) }));
  const ol = lvl(outlet / outletW(home), home.safeFraction, 1);
  add(ol, 'wallOutlet', t(ol === 'warn' ? 'checks.wallOutlet.text.warn' : ol === 'fail' ? 'checks.wallOutlet.text.fail' : 'checks.wallOutlet.text.ok',
    { pc: fmtW(P.wall), total: fmtW(outlet), load: pct(outlet / outletW(home)) }));

  const worst: Level = checks.some((x) => x.l === 'fail') ? 'fail' : checks.some((x) => x.l === 'warn') ? 'warn' : 'ok';
  return { checks, worst, P, outlet, cap: p.wattage, w };
}
