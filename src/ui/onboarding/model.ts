import { findSpec, getSpec, type Build, type BuildItem, type PartSpec, type SpecOf } from '../../catalog';
import type { PartId } from '../../data/parts';
import { RGB_W, type PowerBreakdown } from '../../data/scenarios';
import { evaluate, type Evaluation } from '../../sim/compat';
import { resolveBuild, validateBuild } from '../../builds';
import { useHome } from '../../state/home';
import { localeOf, t, type MessageKey } from '../../i18n';

/** A complete build's parts, one entry per kind. */
export type Parts = Record<PartId, BuildItem[]>;
/** The wizard's working state: kinds picked so far. */
export type Candidate = Partial<Parts>;

/** Wizard order. Covers every kind, so a full candidate is a complete build. */
export const KINDS: PartId[] = ['case', 'board', 'cpu', 'ram', 'gpu', 'ssd', 'cooler', 'psu'];

const KIND_KEY: Record<PartId, MessageKey> = {
  case: 'onboarding.kind.case',
  board: 'onboarding.kind.board',
  cpu: 'onboarding.kind.cpu',
  ram: 'onboarding.kind.ram',
  gpu: 'onboarding.kind.gpu',
  ssd: 'onboarding.kind.ssd',
  cooler: 'onboarding.kind.cooler',
  psu: 'onboarding.kind.psu'
};

/** The step name for a kind, in the active language. */
export const kindLabel = (kind: PartId): string => t(KIND_KEY[kind]);

/** A number in the active language's format (decimal comma for pt). */
const num = (n: number): string => n.toLocaleString(localeOf());

export const newBuildId = (): string => `user-${Date.now().toString(36)}`;

export const hasChoice = (c: Candidate, kind: PartId): boolean => (c[kind]?.length ?? 0) > 0;

export const isComplete = (c: Candidate): c is Parts => KINDS.every((k) => hasChoice(c, k));

/** The first (single) spec of a kind, if picked. Candidate ids always come from the catalog or a validated import. */
export function first<K extends PartId>(c: Candidate, kind: K): SpecOf<K> | undefined {
  const item = c[kind]?.[0];
  return item ? getSpec(kind, item.spec) : undefined;
}

/** Sets one kind. Empty items remove it. Keeps memory within the board's slots when the board changes. */
export function withPart(c: Candidate, kind: PartId, items: BuildItem[]): Candidate {
  const next: Candidate = { ...c };
  if (items.length) next[kind] = items;
  else delete next[kind];
  const board = first(next, 'board');
  const ram = next.ram?.[0];
  if (kind === 'board' && board && ram && ram.qty > board.ramSlots) next.ram = [{ ...ram, qty: board.ramSlots }];
  return next;
}

/** Two or three lines of the specs that matter for a kind. */
export function keySpecs(s: PartSpec): string[] {
  switch (s.kind) {
    case 'case':
      return [
        s.formFactors.join(' / '),
        t('onboarding.spec.gpuMax', { mm: s.gpuMaxLenMm }),
        t('onboarding.spec.caseFans', { front: s.frontFans, rear: s.rearFans })
      ];
    case 'board':
      return [`${s.socket} · ${s.chipset}`, `${s.formFactor} · ${s.memType}`, t('onboarding.spec.ramM2', { ram: s.ramSlots, m2: s.m2Slots })];
    case 'cpu':
      return [
        t('onboarding.spec.cores', { cores: s.cores, threads: s.threads }),
        t('onboarding.spec.boost', { ghz: num(s.boostClockGHz) }),
        `${s.socket} · ${s.maxPowerW} W`
      ];
    case 'ram':
      return [t('onboarding.spec.moduleGB', { gb: s.moduleGB }), `${s.memType} ${s.speedMT} MT/s`, `CL${s.cl}`];
    case 'gpu':
      return [
        `${s.vramGB} GB ${s.vramType}`,
        t('onboarding.spec.gpuLength', { mm: s.lengthMm, slots: s.slots }),
        `${s.powerW} W · ${s.connector}`
      ];
    case 'ssd':
      return [
        s.capacityGB >= 1000 ? `${num(s.capacityGB / 1000)} TB` : `${s.capacityGB} GB`,
        `${s.iface}${s.pcieGen ? ` Gen${s.pcieGen}` : ''} · ${s.formFactor}`,
        t('onboarding.spec.readSpeed', { mbs: num(s.readMBs) })
      ];
    case 'cooler':
      return [
        s.type === 'aio' ? (s.radiatorMm ? `${s.radiatorMm} mm AIO` : t('onboarding.spec.aio')) : t('onboarding.spec.airCooler'),
        t('onboarding.spec.fans', { count: s.fanCount, mm: s.fanMm }),
        `${s.powerW} W`
      ];
    case 'psu':
      return [
        `${s.wattage} W`,
        s.efficiency,
        s.native12v2x6 ? t('onboarding.spec.native12v2x6') : t('onboarding.spec.cables8pin')
      ];
  }
}

/** Plain-text filter: every word typed must appear in the maker, line or name. */
export function matches(s: PartSpec, query: string): boolean {
  const hay = `${s.manufacturer} ${s.brand} ${s.name}`.toLowerCase();
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean).every((word) => hay.includes(word));
}

/** "Maker Name", with a quantity when more than one. Empty string when not picked. */
export function describeKind(c: Candidate, kind: PartId): string {
  return (c[kind] ?? [])
    .map((i) => {
      const s = findSpec(i.spec);
      const name = s ? `${s.manufacturer} ${s.name}` : i.spec;
      return i.qty > 1 ? `${name} × ${i.qty}` : name;
    })
    .join(', ');
}

/** Estimated stress draw of whatever is picked, per subsystem (same keys as the full evaluation). */
export function drawOf(c: Candidate): PowerBreakdown {
  return {
    cpu: first(c, 'cpu')?.maxPowerW ?? 0,
    gpu: first(c, 'gpu')?.powerW ?? 0,
    board: first(c, 'board')?.powerW ?? 0,
    ram: (c.ram ?? []).reduce((n, i) => n + i.qty * getSpec('ram', i.spec).powerW, 0),
    ssd: (c.ssd ?? []).reduce((n, i) => n + i.qty * getSpec('ssd', i.spec).powerW, 0),
    cool: first(c, 'cooler')?.powerW ?? 0,
    rgb: RGB_W
  };
}

/** Copies the items without any extra fields from imported JSON. */
export function normalize(parts: Parts): Parts {
  const out = {} as Parts;
  for (const k of KINDS) out[k] = parts[k].map(({ spec, qty }) => ({ spec, qty }));
  return out;
}

/** The Build to save. Trims name and description; no upgrades. */
export function toBuild(id: string, name: string, description: string, parts: Parts): Build {
  const sub = description.trim();
  return {
    version: 1,
    id,
    name: name.trim(),
    ...(sub ? { description: sub } : {}),
    parts: normalize(parts)
  };
}

/** Runs the same checks as the saved build would, with evaluate(candidate, candidate). */
export function evaluateParts(parts: Parts): { ok: true; ev: Evaluation } | { ok: false; errors: string[] } {
  const v = validateBuild({ version: 1, id: 'draft', name: 'draft', parts });
  if (!v.ok) return v;
  const resolved = resolveBuild(v.build);
  return { ok: true, ev: evaluate(resolved, resolved, useHome.getState().home) };
}

/** Parses pasted or uploaded text. Never throws. */
export function parseImport(text: string): { ok: true; build: Build } | { ok: false; errors: string[] } {
  if (!text.trim()) return { ok: false, errors: [t('onboarding.import.empty')] };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    const reason = e instanceof Error ? e.message : t('onboarding.import.unknownError');
    return { ok: false, errors: [t('onboarding.import.notJson', { reason })] };
  }
  const v = validateBuild(raw);
  return v.ok ? { ok: true, build: v.build } : { ok: false, errors: v.errors };
}
