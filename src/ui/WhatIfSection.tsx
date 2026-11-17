import { useMemo } from 'react';
import { displayName, specsOf, type Swap } from '../catalog';
import { applySwap, resolveBuild } from '../builds';
import { localize, useT, type MessageKey } from '../i18n';
import { evaluate, type Check, type CheckId } from '../sim/compat';
import { fmtW, type Level } from '../sim/power';
import { useHome } from '../state/home';
import { useApp } from '../state/store';
import { Bar, Donut, type Seg } from './widgets';

/** The what-if categories, in the order their cards are shown. */
type Cat = 'gpu' | 'cpu' | 'board' | 'ram' | 'ssd' | 'psu';

const CATEGORIES: [Cat, MessageKey][] = [
  ['gpu', 'whatif.cat.gpu'], ['cpu', 'whatif.cat.cpu'], ['board', 'whatif.cat.board'], ['ram', 'whatif.cat.ram'], ['ssd', 'whatif.cat.ssd'], ['psu', 'whatif.cat.psu']
];

/** Which parts a check is about, so problems show up on the part card itself. */
const CHECK_PARTS: Record<CheckId, Cat[]> = {
  cpuSocket: ['cpu', 'board'],
  bios: ['board', 'cpu'],
  cooling: ['cpu'],
  memory: ['ram', 'board'],
  memorySlots: ['ram', 'board'],
  memoryCapacity: ['ram', 'board', 'cpu'],
  platformChange: ['board'],
  gpuLength: ['gpu'],
  gpuThickness: ['gpu'],
  gpuPowerCable: ['gpu'],
  psuForGpu: ['psu', 'gpu'],
  storage: ['ssd'],
  psuLoad: ['psu'],
  wallOutlet: ['psu']
};
const RANK: Record<Level, number> = { ok: 0, warn: 1, fail: 2 };
const STATE_KEY: Record<Level, MessageKey> = { ok: 'whatif.state.ok', warn: 'whatif.state.warn', fail: 'whatif.state.fail' };
const VERDICT_KEY: Record<Level, MessageKey> = { ok: 'whatif.verdict.ok', warn: 'whatif.verdict.warn', fail: 'whatif.verdict.fail' };

function worstOf(cs: Check[]): Level {
  return cs.reduce<Level>((w, c) => (RANK[c.l] > RANK[w] ? c.l : w), 'ok');
}

/** "Brand Name", without repeating the maker when the sheet name already starts with it. */
const optionLabel = displayName;

export default function WhatIfSection() {
  const t = useT();
  const build = useApp((s) => s.build);
  const resolved = useApp((s) => s.resolved);
  const home = useHome((h) => h.home);
  const swap = useApp((s) => s.swap);
  const setSwap = useApp((s) => s.setSwap);
  const resetSwap = useApp((s) => s.resetSwap);
  const tryUpgrade = useApp((s) => s.tryUpgrade);

  const candidate = useMemo(() => resolveBuild(applySwap(build, swap)), [build, swap]);
  const E = useMemo(() => evaluate(candidate, resolved, home), [candidate, resolved, home, t]);

  const isChanged = (k: Cat): boolean => (k === 'ram' ? swap.ram !== undefined : k === 'ssd' ? swap.addSsd !== undefined : swap[k] !== undefined);
  const changed = CATEGORIES.filter(([cat]) => isChanged(cat));
  const sameAsBuild = changed.length === 0;
  const segs: Seg[] = [
    { n: t('whatif.seg.gpu'), v: E.w.gpu, c: '--c1', part: 'gpu' },
    { n: t('whatif.seg.cpu'), v: E.w.cpu, c: '--c2', part: 'cpu' },
    { n: t('whatif.seg.board'), v: E.w.board + E.w.ram + E.w.ssd, c: '--c3', part: 'board' },
    { n: t('whatif.seg.cooler'), v: E.w.cool + E.w.rgb, c: '--c4', part: 'cooler' }
  ];
  const issues = E.checks.filter((c) => c.l !== 'ok');
  const passed = E.checks.length - issues.length;
  const presets = (build.upgrades ?? []).flatMap((u) => (u.swap ? [{ rank: u.rank, title: localize(u.title), swap: u.swap }] : []));

  // The build's own parts: the first line of each kind.
  const own = {
    gpu: build.parts.gpu[0].spec,
    cpu: build.parts.cpu[0].spec,
    board: build.parts.board[0].spec,
    psu: build.parts.psu[0].spec
  };
  const ownRam = build.parts.ram[0];
  const ramSpec = swap.ram?.spec ?? ownRam.spec;
  const ramQty = swap.ram?.qty ?? ownRam.qty;
  const ramMax = candidate.board.ramSlots;

  /** Writes the memory line; the build's own spec and quantity clear the change. */
  const setRam = (spec: string, qty: number) => {
    setSwap({ ram: spec === ownRam.spec && qty === ownRam.qty ? undefined : { spec, qty } });
  };

  const pickSingle = (kind: 'gpu' | 'cpu' | 'board' | 'psu', id: string) => {
    setSwap({ [kind]: id === own[kind] ? undefined : id } as Pick<Swap, typeof kind>);
  };

  return (
    <div className="wi">
      <ol className="flow">
        <li className="step">
          <div className="step-h">
            <span className="step-n">1</span>
            <div>
              <h3>{t('whatif.step1.title')}</h3>
              <p>{presets.length ? t('whatif.step1.presets') : t('whatif.step1.none')}</p>
            </div>
          </div>
          {presets.length ? (
            <div className="presets">
              {presets.map((u) => (
                <button key={u.rank} type="button" className="preset" onClick={() => tryUpgrade(u.swap)}>
                  {u.title}
                </button>
              ))}
            </div>
          ) : null}
        </li>

        <li className="step">
          <div className="step-h">
            <span className="step-n">2</span>
            <div>
              <h3>{t('whatif.step2.title')}</h3>
              <p>
                {sameAsBuild
                  ? t('whatif.step2.same')
                  : t(changed.length === 1 ? 'whatif.step2.changedOne' : 'whatif.step2.changedMany', { count: changed.length })}
              </p>
            </div>
            {sameAsBuild ? null : (
              <button type="button" className="ghost" id="wi-reset" onClick={resetSwap}>
                {t('whatif.reset')}
              </button>
            )}
          </div>
          <div className="nodes">
            {CATEGORIES.map(([cat, labelKey]) => {
              const label = t(labelKey);
              const mine = E.checks.filter((c) => CHECK_PARTS[c.id].includes(cat));
              const state = worstOf(mine);
              const isNew = isChanged(cat);
              const probs = mine.filter((c) => c.l !== 'ok');
              return (
                <div key={cat} className={'node n-' + state + (isNew ? ' is-new' : '')}>
                  <div className="node-h">
                    <span className="node-k">{label}</span>
                    <span className={'node-s s-' + state}>
                      <i />
                      {t(STATE_KEY[state])}
                    </span>
                  </div>
                  {cat === 'ram' ? (
                    <>
                      <label className="node-pick">
                        <span className="sr">{label}</span>
                        <select id="wi-ram" value={ramSpec} onChange={(e) => setRam(e.target.value, ramQty)}>
                          {specsOf('ram').map((s) => (
                            <option key={s.id} value={s.id}>
                              {optionLabel(s)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <span className="qty">
                        <button type="button" className="ghost" aria-label={t('whatif.ram.fewer')} disabled={ramQty <= 1} onClick={() => setRam(ramSpec, ramQty - 1)}>
                          −
                        </button>
                        <span>{t(ramQty === 1 ? 'whatif.ram.countOne' : 'whatif.ram.countMany', { count: ramQty })}</span>
                        <button type="button" className="ghost" aria-label={t('whatif.ram.more')} disabled={ramQty >= ramMax} onClick={() => setRam(ramSpec, ramQty + 1)}>
                          +
                        </button>
                      </span>
                    </>
                  ) : cat === 'ssd' ? (
                    <label className="node-pick">
                      <span className="sr">{label}</span>
                      <select id="wi-ssd" value={swap.addSsd ?? ''} onChange={(e) => setSwap({ addSsd: e.target.value || undefined })}>
                        <option value="">{t('whatif.ssd.none')}</option>
                        {specsOf('ssd').map((s) => (
                          <option key={s.id} value={s.id}>
                            {optionLabel(s)}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <label className="node-pick">
                      <span className="sr">{label}</span>
                      <select id={'wi-' + cat} value={swap[cat] ?? own[cat]} onChange={(e) => pickSingle(cat, e.target.value)}>
                        {specsOf(cat).map((s) => (
                          <option key={s.id} value={s.id}>
                            {optionLabel(s)}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  {isNew ? <span className="node-tag">{t('whatif.tag.changed')}</span> : <span className="node-tag mine">{t('whatif.tag.mine')}</span>}
                  {probs.map((c, i) => (
                    <p key={i} className={'node-issue s-' + c.l}>
                      <b>{c.label}:</b> {c.text}
                    </p>
                  ))}
                </div>
              );
            })}
          </div>
        </li>

        <li className="step">
          <div className="step-h">
            <span className="step-n">3</span>
            <div>
              <h3>{t('whatif.step3.title')}</h3>
              <p>
                {issues.length
                  ? t('whatif.step3.attention', { passed, total: E.checks.length, issues: issues.length })
                  : t('whatif.step3.pass', { passed, total: E.checks.length })}
              </p>
            </div>
          </div>
          <div className={'verdict v-' + E.worst} role="status">
            {t(VERDICT_KEY[E.worst])}
            <span>
              {E.worst === 'fail'
                ? t('whatif.verdict.fixFail')
                : t('whatif.verdict.power', { dc: fmtW(E.P.dc), outlet: fmtW(E.outlet) })}
            </span>
          </div>
          <details className="allchecks">
            <summary>{t('whatif.allChecks', { count: E.checks.length })}</summary>
            <ul className="checks">
              {E.checks.map((c, i) => (
                <li key={i} className={c.l}>
                  <i />
                  <span>
                    <b>{c.label}</b>: {c.text}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        </li>

        <li className="step">
          <div className="step-h">
            <span className="step-n">4</span>
            <div>
              <h3>{t('whatif.step4.title', { cap: E.cap })}</h3>
              <p>{t('whatif.step4.mark')}</p>
            </div>
          </div>
          <div className="chart">
            <Donut segs={segs} total={E.P.dc} center={fmtW(E.P.dc)} />
            <Bar segs={segs} total={Math.max(E.cap, E.P.dc)} marks={[E.cap * 0.8]} />
          </div>
        </li>
      </ol>
    </div>
  );
}
