import { useState, type CSSProperties, type ReactNode } from 'react';
import type { PartId } from '../data/parts';
import { useT, type MessageKey } from '../i18n';
import { fmtW, type Level } from '../sim/power';
import { useApp } from '../state/store';

export interface Seg { n: string; v: number; c: string; /** Clicking this segment isolates the part in 3D. */ part?: PartId }

const MARK = '\u0001';

/** A message with some values in bold. Each value is swapped for a numbered marker first, so the bold stays on the right value in every language. */
export function Emph({ k, vals, cls }: { k: MessageKey; vals: Record<string, string>; cls?: string }) {
  const t = useT();
  const names = Object.keys(vals);
  const marked = t(k, Object.fromEntries(names.map((n, i) => [n, `${MARK}${i}${MARK}`])));
  return (
    <>
      {marked.split(new RegExp(`${MARK}(\\d+)${MARK}`)).map((p, i) => (i % 2 ? <b key={i} className={cls}>{vals[names[Number(p)]]}</b> : p))}
    </>
  );
}

export function Bar({ segs, total, marks = [] }: { segs: Seg[]; total: number; marks?: number[] }) {
  const t = useT();
  const active = useApp((s) => s.part);
  const togglePart = useApp((s) => s.togglePart);
  return (
    <div className={marks.length ? 'barwrap marked' : 'barwrap'}>
      <div className="pbar">
        {segs.map((sg) => (
          <i
            key={sg.n}
            className={(sg.part ? 'click ' : '') + (active && sg.part && sg.part !== active ? 'dim' : '')}
            style={{ width: Math.max(0, Math.min(100, (sg.v / total) * 100)) + '%', background: `var(${sg.c})` }}
            title={t(sg.part ? 'panel.seg.titleIsolate' : 'panel.seg.title', { name: sg.n, value: fmtW(sg.v) })}
            onClick={sg.part ? () => togglePart(sg.part as PartId) : undefined}
          />
        ))}
      </div>
      {marks.map((m) => (
        <span key={m} className="mark" style={{ left: `calc(${(m / total) * 100}% - 1px)` }}>
          <em>{Math.round((m / total) * 100)}%</em>
        </span>
      ))}
    </div>
  );
}

export function Legend({ segs }: { segs: Seg[] }) {
  return (
    <div className="lg">
      {segs.map((sg) => (
        <span key={sg.n} style={{ '--c': `var(${sg.c})` } as CSSProperties}>
          {sg.n} {fmtW(sg.v)}
        </span>
      ))}
    </div>
  );
}

export function Kv({ k, v, cls }: { k: string; v: string; cls?: string }) {
  return (
    <div className="kv">
      <span>{k}</span>
      <b className={cls}>{v}</b>
    </div>
  );
}

export function Stat({ label, value, note, level = 'ok' }: { label: string; value: string; note?: ReactNode; level?: Level }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <b>{value}</b>
      {note ? <em className={'s-' + level}>{note}</em> : null}
    </div>
  );
}

const LEVEL_VAR: Record<Level, string> = { ok: 'var(--ok)', warn: 'var(--warn)', fail: 'var(--fail)' };

/** Instrument dial: 270° of tick marks, lit up to `value` (a 0–1 fraction; above 1 clamps to full). */
export function Gauge({ value, text, label, note, level = 'ok' }: { value: number; text: string; label: string; note?: string; level?: Level }) {
  const t = useT();
  const f = Math.max(0, Math.min(1, value));
  const N = 40;
  return (
    <div className="gauge">
      <svg viewBox="0 0 100 92" role="img" aria-label={t('panel.gauge.label', { label, text })}>
        {Array.from({ length: N }, (_, i) => {
          const t = i / (N - 1);
          const a = ((135 + t * 270) * Math.PI) / 180;
          const major = i % 13 === 0;
          const r1 = major ? 31 : 35, r2 = 43;
          const on = t <= f + 0.0001 && f > 0;
          return (
            <line
              key={i}
              x1={50 + r1 * Math.cos(a)} y1={50 + r1 * Math.sin(a)} x2={50 + r2 * Math.cos(a)} y2={50 + r2 * Math.sin(a)}
              strokeWidth={major ? 2 : 1.6} stroke={on ? LEVEL_VAR[level] : 'var(--track)'} className="g-tick"
            />
          );
        })}
        <text className="g-num" x="50" y="57" textAnchor="middle">{text}</text>
      </svg>
      <div className="g-label">{label}</div>
      {note ? <div className="g-note" style={{ color: LEVEL_VAR[level] }}>{note}</div> : null}
    </div>
  );
}

/** Ring chart of watt segments with the total in the middle. Segments with a `part` are clickable and isolate it in 3D. */
export function Donut({ segs, total, center }: { segs: Seg[]; total: number; center: string }) {
  const t = useT();
  const active = useApp((s) => s.part);
  const togglePart = useApp((s) => s.togglePart);
  let acc = 0;
  return (
    <div className="donutwrap">
      <svg className="donut" viewBox="0 0 120 120" role="img" aria-label={t('panel.donut.label', { center })}>
        <circle cx="60" cy="60" r="46" fill="none" stroke="var(--track)" strokeWidth="14" />
        {segs.map((sg) => {
          const len = Math.max(0, (sg.v / total) * 100);
          const dim = active && sg.part && sg.part !== active;
          const el = (
            <circle
              key={sg.n} cx="60" cy="60" r="46" fill="none" strokeWidth={active && sg.part === active ? 18 : 14} pathLength="100" stroke={`var(${sg.c})`}
              strokeDasharray={`${Math.max(0, len - 0.8)} 100`} strokeDashoffset={-acc} transform="rotate(-90 60 60)"
              opacity={dim ? 0.3 : 1} className={sg.part ? 'click' : undefined} onClick={sg.part ? () => togglePart(sg.part as PartId) : undefined}
            >
              <title>{t('panel.seg.title', { name: sg.n, value: fmtW(sg.v) })}</title>
            </circle>
          );
          acc += len;
          return el;
        })}
        <text className="d-num" x="60" y="62" textAnchor="middle">{center}</text>
        <text className="d-sub" x="60" y="78" textAnchor="middle">{t('panel.donut.dcLoad')}</text>
      </svg>
      <ul className="dlist">
        {segs.map((sg) => (
          <li key={sg.n} style={{ '--c': `var(${sg.c})` } as CSSProperties} className={active && sg.part === active ? 'on' : undefined}>
            {sg.part ? (
              <button type="button" className="dl-btn" aria-pressed={active === sg.part} onClick={() => togglePart(sg.part as PartId)}>
                {sg.n}
              </button>
            ) : (
              <span>{sg.n}</span>
            )}
            <b>{fmtW(sg.v)}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** PSU efficiency vs load: the curve, the best range, the 80% mark and the current operating point. */
export function EffCurve({ load, eff, fn }: { load: number; eff: number; fn: (f: number) => number }) {
  const t = useT();
  const [hover, setHover] = useState<number | null>(null);
  const W = 420, H = 180, L = 34, R = 10, T = 22, B = 26;
  const xMax = 1.2, yMin = 0.76, yMax = 0.92;
  const x = (f: number) => L + (Math.min(f, xMax) / xMax) * (W - L - R);
  const y = (e: number) => T + (1 - (e - yMin) / (yMax - yMin)) * (H - T - B);
  const pts = Array.from({ length: 61 }, (_, i) => (i / 60) * xMax);
  const line = pts.map((f, i) => (i ? 'L' : 'M') + x(f).toFixed(1) + ' ' + y(fn(f)).toFixed(1)).join(' ');
  const cx = x(load), cy = y(eff);
  const chip = (px: number, py: number, label: string, key: string) => {
    const w = label.length * 5.4 + 10;
    const left = Math.min(Math.max(px - w / 2, L), W - R - w);
    return (
      <g key={key} pointerEvents="none">
        <rect className="c-chip" x={left} y={py - 9} width={w} height={15} />
        <text className="c-chip-t" x={left + w / 2} y={py + 2} textAnchor="middle">{label}</text>
      </g>
    );
  };
  return (
    <svg
      className="curve" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('panel.eff.label')}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const vx = ((e.clientX - r.left) / r.width) * W;
        setHover(Math.min(xMax, Math.max(0, ((vx - L) / (W - L - R)) * xMax)));
      }}
      onPointerLeave={() => setHover(null)}
    >
      <rect className="c-best" x={x(0.4)} y={T} width={x(0.6) - x(0.4)} height={H - T - B} />
      <text className="c-best-t" x={(x(0.4) + x(0.6)) / 2} y={T - 7} textAnchor="middle">{t('panel.eff.best')}</text>
      {[0.78, 0.82, 0.86, 0.9].map((e) => (
        <g key={e}>
          <line className="c-grid" x1={L} x2={W - R} y1={y(e)} y2={y(e)} />
          <text x={L - 6} y={y(e) + 3} textAnchor="end">{Math.round(e * 100)}%</text>
        </g>
      ))}
      <line className="c-axis" x1={L} x2={W - R} y1={H - B} y2={H - B} />
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <g key={f}>
          <line className="c-tick" x1={x(f)} x2={x(f)} y1={H - B} y2={H - B + 4} />
          <text x={x(f)} y={H - 8} textAnchor="middle">{Math.round(f * 100)}%</text>
        </g>
      ))}
      <line className="c-limit" x1={x(0.8)} x2={x(0.8)} y1={T} y2={H - B} />
      <text className="c-limit-t" x={x(0.8) + 4} y={T + 9}>80%</text>
      <path className="c-area" d={`${line} L${x(xMax)} ${H - B} L${x(0)} ${H - B} Z`} />
      <path className="c-line" d={line} />
      <line className="c-drop" x1={cx} x2={cx} y1={cy} y2={H - B} />
      <circle className="c-halo" cx={cx} cy={cy} r="10" />
      <circle className="c-dot" cx={cx} cy={cy} r="5" />
      {hover === null ? chip(cx, Math.max(cy - 20, T + 12), `${Math.round(eff * 100)}%`, 'now') : null}
      {hover !== null ? (
        <g pointerEvents="none">
          <line className="c-cross" x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} />
          <circle className="c-dot small" cx={x(hover)} cy={y(fn(hover))} r="4" />
          {chip(x(hover), T + 14, t('panel.eff.point', { load: Math.round(hover * 100), eff: Math.round(fn(hover) * 100) }), 'hover')}
        </g>
      ) : null}
    </svg>
  );
}

/** Column chart: one bar per scenario; clicking a bar selects it. */
export function ScenarioBars({ items, active, onPick }: { items: { id: string; label: string; v: number }[]; active: string; onPick: (id: string) => void }) {
  const t = useT();
  const max = Math.max(...items.map((i) => i.v));
  return (
    <div className="scbars" role="group" aria-label={t('panel.scen.group')}>
      {items.map((it) => (
        <button key={it.id} type="button" className="scbar" aria-pressed={active === it.id} title={`${it.label}: ${fmtW(it.v)}`} onClick={() => onPick(it.id)}>
          <b>{fmtW(it.v)}</b>
          <i style={{ height: Math.round((it.v / max) * 82) + '%' }} />
          <span>{it.label}</span>
        </button>
      ))}
    </div>
  );
}

/** Horizontal temperature bars on a 25–95 °C scale, coloured with the heat-map ramp. Rows with a `part` isolate it in 3D. */
export function TempBars({ rows }: { rows: { k: string; t: number; part?: PartId }[] }) {
  const t = useT();
  const active = useApp((s) => s.part);
  const togglePart = useApp((s) => s.togglePart);
  return (
    <div className="tbars">
      {rows.map((r) => {
        const f = Math.max(0.04, Math.min(1, (r.t - 25) / 70));
        const body = (
          <>
            <span>{r.k}</span>
            <div className="tt"><i style={{ width: f * 100 + '%', backgroundSize: 100 / f + '% 100%' }} /></div>
            <b>{r.t} °C</b>
          </>
        );
        return r.part ? (
          <button type="button" className="tbar click" key={r.k} aria-pressed={active === r.part} title={t('panel.temp.isolate')} onClick={() => togglePart(r.part as PartId)}>
            {body}
          </button>
        ) : (
          <div className="tbar" key={r.k}>{body}</div>
        );
      })}
    </div>
  );
}
