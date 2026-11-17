import { useMemo, type CSSProperties } from 'react';
import type { IconType } from 'react-icons';
import { BsCpu, BsDeviceSsd, BsFan, BsGpuCard, BsLightningCharge, BsMemory, BsMotherboard, BsPc } from 'react-icons/bs';
import { MdKeyboardArrowDown, MdStraighten } from 'react-icons/md';
import { partRows, ramLimits, ramProfile } from '../builds/rows';
import { fmtGB, type PartId, type PartItem, type PartRow } from '../data/parts';
import { useT, type MessageKey, useLang } from '../i18n';
import { fmtW } from '../sim/power';
import { useApp } from '../state/store';
import { Emph } from './widgets';

const ICON: Record<PartId, IconType> = {
  gpu: BsGpuCard,
  cpu: BsCpu,
  cooler: BsFan,
  ram: BsMemory,
  board: BsMotherboard,
  ssd: BsDeviceSsd,
  psu: BsLightningCharge,
  case: BsPc
};

const COLOR: Record<PartId, string> = { gpu: '--c1', cpu: '--c2', cooler: '--c3', ram: '--c4', board: '--c6', ssd: '--c7', psu: '--accent', case: '--c5' };

/** Identical items (four sticks of the same memory) collapse into one card with a count. */
function groupItems(items: PartItem[]): { it: PartItem; count: number }[] {
  const groups: { it: PartItem; count: number }[] = [];
  for (const it of items) {
    const g = groups.find((x) => x.it.spec === it.spec && x.it.name === it.name && x.it.detail === it.detail);
    if (g) g.count++;
    else groups.push({ it, count: 1 });
  }
  return groups;
}

/** One line under the type name: the part itself, or how many there are. */
function summary(r: PartRow, t: (k: MessageKey, p?: Record<string, string | number>) => string): string {
  const [first] = r.items;
  if (r.items.length === 1) return first.name;
  return r.items.every((i) => i.name === first.name)
    ? t('panel.parts.summaryAll', { count: r.items.length, name: first.name })
    : t('panel.parts.summaryCount', { count: r.items.length });
}

export default function PartsSection() {
  const t = useT();
  const part = useApp((s) => s.part);
  const scen = useApp((s) => s.scen);
  const togglePart = useApp((s) => s.togglePart);
  const resolved = useApp((s) => s.resolved);
  const scenarios = useApp((s) => s.scenarios);
  const lang = useLang((s) => s.lang); // partRows() translates with the active language
  const rows = useMemo(() => partRows(resolved), [resolved, lang]);
  const lim = ramLimits(resolved);
  const xmp = ramProfile(resolved);
  const psuW = resolved.psu.wattage;
  const w = scenarios[scen].w;
  const watts: Partial<Record<PartId, number>> = { gpu: w.gpu, cpu: w.cpu, cooler: w.cool, ram: w.ram, board: w.board, ssd: w.ssd };
  const pairs = Array.from({ length: Math.ceil(rows.length / 2) }, (_, i) => rows.slice(i * 2, i * 2 + 2));

  const sumOf = (r: PartRow) => {
    const gbs = r.items.filter((i) => i.gb !== undefined);
    return gbs.length ? gbs.reduce((t, i) => t + (i.gb ?? 0), 0) : null;
  };

  const detail = (r: PartRow) => {
    const gb = sumOf(r);
    const pw = watts[r.part];
    return (
      <div className="pdetail" id={'pd-' + r.part} key={'d-' + r.part}>
        <h4>{r.type}</h4>
        <div className="items">
          {groupItems(r.items).map(({ it, count }, i) => (
            <div className="comp" key={i}>
              <div className="comp-head">
                {count > 1 ? <em className="comp-qty">{count} ×</em> : null}
                <b>{it.name}</b>
              </div>
              {it.specs ? (
                <dl className="specgrid" style={{ '--cols': it.specs.length % 3 === 0 ? 3 : 2 } as CSSProperties}>
                  {it.specs.map((sp) => (
                    <div key={sp.k}>
                      <dt>{sp.k}</dt>
                      <dd>{sp.v}</dd>
                    </div>
                  ))}
                </dl>
              ) : it.detail ? (
                <ul className="spec">
                  {it.detail.split(' · ').map((d, k) => (
                    <li key={k}>{d}</li>
                  ))}
                </ul>
              ) : null}
              {it.dims ? (
                <span className="meas">
                  <MdStraighten aria-hidden="true" />
                  {it.dims}
                </span>
              ) : null}
            </div>
          ))}
        </div>
        {gb !== null ? (
          <div className="sumrow">
            <span>{t('panel.parts.total', { type: r.type.toLowerCase() })}</span>
            <b>{fmtGB(gb)}</b>
          </div>
        ) : null}
        {r.part === 'ram' && gb !== null ? (
          <>
            <div className="memuse">
              <div className="mu-top">
                <span>{t('panel.parts.installedOfMax')}</span>
                <b>{t('panel.parts.of', { used: fmtGB(gb), max: fmtGB(lim.maxGB) })}</b>
              </div>
              <div className="mu-track"><i style={{ width: Math.min(100, (gb / lim.maxGB) * 100) + '%' }} /></div>
              <span className="mu-free">{t('panel.parts.headroom', { free: fmtGB(Math.max(0, lim.maxGB - gb)) })}</span>
              <span className="mu-note">{t('panel.parts.maxSetBy', { by: lim.limitedBy })}</span>
            </div>
            <div className="slots">
              <div className="sl-top">
                <span>{t('panel.parts.slotsLabel')}</span>
                <b>{t('panel.parts.slotsUsed', { used: r.items.length, total: lim.slots })}</b>
              </div>
              <div className="sl-row" aria-hidden="true">
                {Array.from({ length: lim.slots }, (_, i) => (
                  <i key={i} className={i < r.items.length ? 'full' : ''} />
                ))}
              </div>
              <span className="sl-hint">
                {r.items.length >= lim.slots
                  ? t('panel.parts.slotsFull', { max: fmtGB(lim.perSlotMaxGB) })
                  : t('panel.parts.slotsFree', { free: lim.slots - r.items.length, max: fmtGB(lim.perSlotMaxGB) })}
              </span>
            </div>
            <div className="xmp">
              <span className={'xmp-badge ' + (xmp.enabled ? 'on' : 'off')}>{t(xmp.enabled ? 'panel.parts.xmpOn' : 'panel.parts.xmpOff')}</span>
              <b>{t('panel.parts.mhz', { mhz: xmp.enabled ? xmp.ratedMHz : xmp.jedecMHz })}</b>
              <small>{xmp.enabled ? t('panel.parts.xmpRatedNote') : t('panel.parts.xmpJedecNote', { mhz: xmp.ratedMHz })}</small>
            </div>
          </>
        ) : null}
        {pw !== undefined ? (
          <div className="pwr">
            <div className="pw-top">
              <span>{t('panel.parts.powerLabel')}</span>
              <b>{t('panel.parts.of', { used: fmtW(pw), max: fmtW(psuW) })}</b>
            </div>
            <div className="track marked">
              <i className={pw / psuW >= 0.9 ? 'hi' : pw / psuW >= 0.8 ? 'warn' : ''} style={{ width: Math.max(1, (pw / psuW) * 100) + '%' }} />
              <span className="mark" style={{ left: 'calc(80% - 1px)' }}>
                <em>80%</em>
              </span>
            </div>
            <div className="pw-foot">
              <span>
                <Emph k="panel.parts.psuShare" cls="n-blue" vals={{ pct: Math.round((pw / psuW) * 100) + '%' }} />
              </span>
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <>
      <div className="rows">
        {pairs.map((pair, pi) => {
          const openRow = pair.find((r) => r.part === part);
          return (
            <div className="pair" key={pi}>
              {pair.map((r) => {
                const open = part === r.part;
                const gb = sumOf(r);
                return (
                  <button
                    key={r.part} type="button" className={'row tile' + (open ? ' open' : '')} id={'part-' + r.part} aria-pressed={open} aria-expanded={open} aria-controls={'pd-' + r.part}
                    onClick={() => togglePart(r.part)} style={{ '--c': `var(${COLOR[r.part]})` } as CSSProperties}
                  >
                    <span className="badge">
                      {(() => { const Icon = ICON[r.part]; return <Icon aria-hidden="true" />; })()}
                    </span>
                    <MdKeyboardArrowDown className="chev" aria-hidden="true" />
                    <span className="val">
                      <strong>{r.type}</strong>
                      <span>{summary(r, t)}</span>
                    </span>
                    {gb !== null ? <span className="tsum">{fmtGB(gb)}</span> : null}
                  </button>
                );
              })}
              {openRow ? detail(openRow) : null}
            </div>
          );
        })}
      </div>
    </>
  );
}
