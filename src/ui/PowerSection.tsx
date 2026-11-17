import type { CSSProperties } from 'react';
import { CONN_W, SCEN_IDS, WEEKS_PER_MONTH } from '../data/scenarios';
import { localeOf, useT } from '../i18n';
import { SCEN_LABEL } from '../i18n/messages/power';
import { devicesW, outletSafeW, outletW } from '../sim/home';
import { effAt, fmtKwh, fmtW, lvl, pct, powerOf } from '../sim/power';
import { useHome } from '../state/home';
import { formatMoney, useSettings } from '../state/settings';
import { useApp } from '../state/store';
import InfoButton from './InfoButton';
import { Bar, Donut, EffCurve, Gauge, Kv, Legend, ScenarioBars, TempBars, type Seg } from './widgets';

/** Series colours for the devices on the outlet, after the PC's own. */
const DEVICE_COLORS = ['--c3', '--c5', '--c6', '--c7'];

/** Highest point of the efficiency curve and the load where it happens. */
function effPeak() {
  let best = { load: 0, eff: 0 };
  for (let i = 0; i <= 120; i++) {
    const load = i / 100;
    const eff = effAt(load);
    if (eff > best.eff) best = { load, eff };
  }
  return best;
}

export default function PowerSection() {
  const t = useT();
  const scen = useApp((s) => s.scen);
  const setScen = useApp((s) => s.setScen);
  const scenarios = useApp((s) => s.scenarios);
  const psuW = useApp((s) => s.resolved.psu.wattage);
  const kwhPrice = useSettings((s) => s.kwhPrice);
  const currency = useSettings((s) => s.currency);
  const playHours = useSettings((s) => s.playHours);
  const home = useHome((h) => h.home);
  const S = scenarios[scen];
  const P = powerOf(S.w, psuW);
  const outCap = outletW(home);
  const out = P.wall + devicesW(home, scen);
  const ll = lvl(P.load, 0.8, 1);
  const ol = lvl(out / outCap, home.safeFraction, 1);
  const cl = S.w.gpu / CONN_W;
  const segs: Seg[] = [
    { n: 'GPU', v: S.w.gpu, c: '--c1', part: 'gpu' },
    { n: 'CPU', v: S.w.cpu, c: '--c2', part: 'cpu' },
    { n: t('power.seg.board'), v: S.w.board + S.w.ram + S.w.ssd, c: '--c3', part: 'board' },
    { n: t('power.seg.cooling'), v: S.w.cool + S.w.rgb, c: '--c4', part: 'cooler' }
  ];
  const oseg: Seg[] = [
    { n: t('power.seg.pc'), v: P.wall, c: '--c1' },
    ...home.devices.map((d, i) => ({ n: d.name || t('power.seg.device'), v: scen === 'idle' ? (d.idleWatts ?? d.watts) : d.watts, c: DEVICE_COLORS[i % DEVICE_COLORS.length] }))
  ];
  const peak = effPeak();
  const noteLevel = ll === 'ok' ? 'power.gauge.ok' : ll === 'warn' ? 'power.gauge.warn' : 'power.gauge.fail';
  return (
    <>
      <div className="block">
        <div className="seg" role="group" aria-label={t('power.scenario.aria')}>
          {SCEN_IDS.map((k) => (
            <button key={k} type="button" id={'pw-' + k} aria-pressed={scen === k} onClick={() => setScen(k)}>
              {t(SCEN_LABEL[k])}
            </button>
          ))}
        </div>
      </div>
      <div className="hero">
        <span className="hero-k">{t('power.hero.label')}</span>
        <b>
          {Math.round(P.wall).toLocaleString(localeOf())}
          <small>W</small>
        </b>
        <dl className="specgrid" style={{ '--cols': 3 } as CSSProperties}>
          <div>
            <dt>{t('power.cell.scenario')}</dt>
            <dd>{t(SCEN_LABEL[scen])}</dd>
          </div>
          <div>
            <dt>{t('power.cell.efficiency')}</dt>
            <dd>{pct(P.eff)}</dd>
          </div>
          <div>
            <dt>{t('power.cell.energy')}</dt>
            <dd>{fmtKwh(P.wall)} kWh</dd>
          </div>
        </dl>
        <div className="cost">
          <h3>{t('power.cost.title')}</h3>
          <dl className="specgrid" style={{ '--cols': 2 } as CSSProperties}>
            <div>
              <dt>{t('power.cost.perHour')}</dt>
              <dd>{formatMoney((P.wall / 1000) * kwhPrice, currency)}</dd>
            </div>
            <div>
              <dt>{t('power.cost.perMonth')}</dt>
              <dd className="accent">{formatMoney((P.wall / 1000) * playHours * WEEKS_PER_MONTH * kwhPrice, currency)}</dd>
            </div>
          </dl>
          <p>{t('power.cost.assume')}</p>
        </div>
      </div>
      <div className="gauges">
        <Gauge value={P.load} text={pct(P.load)} label={t('power.gauge.psuLoad')} note={t(noteLevel)} level={ll} />
        <Gauge value={out / outCap} text={pct(out / outCap)} label={t('power.gauge.outlet')} note={t('power.gauge.of', { used: fmtW(out), max: fmtW(outCap) })} level={ol} />
        <Gauge value={cl} text={pct(cl)} label="12V-2x6" note={t('power.gauge.of', { used: fmtW(S.w.gpu), max: fmtW(CONN_W) })} level={lvl(cl, 0.7, 0.95)} />
      </div>
      <div className="chart">
        <h3>
          {t('power.chart.wall')}<small>{t('power.chart.wallSub', { watts: fmtW(P.wall), eff: pct(P.eff) })}</small>
        </h3>
        <ScenarioBars items={SCEN_IDS.map((k) => ({ id: k, label: t(SCEN_LABEL[k]), v: powerOf(scenarios[k].w, psuW).wall }))} active={scen} onPick={(k) => setScen(k as typeof scen)} />
        <p className="note">{t('power.note.model')}</p>
      </div>
      <div className="block">
        <h3>{t('power.dc.title')}</h3>
        <div className="chart">
          <Donut segs={segs} total={P.dc} center={fmtW(P.dc)} />
          <Bar segs={segs} total={psuW} marks={[psuW * 0.8]} />
        </div>
      </div>
      <div className="chart">
        <h3>
          <span className="h3-title">
            {t('power.chart.effCurve')}
            <InfoButton label={t('power.eff.info.open')} title={t('power.chart.effCurve')}>
              <p className="modal-lead">{t('power.eff.info.lead')}</p>
              <section className="modal-section">
                <h3>{t('power.eff.info.readTitle')}</h3>
                <p>{t('power.eff.info.readText')}</p>
              </section>
              <section className="modal-section">
                <h3>{t('power.eff.info.bendTitle')}</h3>
                <p>{t('power.eff.info.bendText')}</p>
              </section>
              <section className="modal-section">
                <h3>{t('power.eff.info.whyTitle')}</h3>
                <p>{t('power.eff.info.whyText')}</p>
                <p>{t('power.eff.info.estNote')}</p>
              </section>
            </InfoButton>
          </span>
          <small>{t('power.chart.effNow', { eff: pct(P.eff) })}</small>
        </h3>
        <EffCurve load={P.load} eff={P.eff} fn={effAt} />
        <dl className="chart-specgrid">
          <div>
            <dt>{t('power.eff.cell.load')}</dt>
            <dd>{pct(P.load)}</dd>
          </div>
          <div>
            <dt>{t('power.eff.cell.now')}</dt>
            <dd className="accent">{pct(P.eff)}</dd>
          </div>
          <div>
            <dt>{t('power.eff.cell.peak')}</dt>
            <dd>{t('panel.eff.point', { load: Math.round(peak.load * 100), eff: Math.round(peak.eff * 100) })}</dd>
          </div>
        </dl>
      </div>
      <div className="chart">
        <h3>
          {t('power.temps.title')}<small>25–95 °C</small>
        </h3>
        <TempBars rows={[
          { k: 'CPU', t: S.t.cpu, part: 'cpu' }, { k: 'GPU', t: S.t.gpu, part: 'gpu' }, { k: 'VRM', t: S.t.vrm, part: 'board' },
          { k: 'SSD', t: S.t.ssd, part: 'ssd' }, { k: 'RAM', t: S.t.ram, part: 'ram' }, { k: 'PSU', t: S.t.psu, part: 'psu' }
        ]} />
      </div>
      <div className="block">
        <h3>{t('power.outlet.title', { volts: home.volts, amps: home.amps })}</h3>
        <Bar segs={oseg} total={outCap} marks={[outletSafeW(home)]} />
        <Legend segs={oseg} />
        <p className="note">{t('power.outlet.note', { limit: pct(home.safeFraction), watts: fmtW(outletSafeW(home)) })}</p>
      </div>
      <div className="block">
        <h3>{t('power.details.title')}</h3>
        <Kv k={t('power.kv.connector')} v={t('power.kv.connectorValue', { used: fmtW(S.w.gpu), max: fmtW(CONN_W), pct: pct(cl) })} cls={'s-' + lvl(cl, 0.7, 0.95)} />
        <Kv k={t('power.kv.headroom')} v={fmtW(psuW - P.dc)} />
        <Kv k={t('power.kv.heat')} v={Math.round(P.wall * 3.412).toLocaleString(localeOf()) + ' BTU/h'} />
        <Kv k={t('power.kv.energy')} v={fmtKwh(P.wall) + ' kWh'} />
      </div>
      <p className="note">
        {t('power.note.sources', { gpu: 360, cpu: 190 })}
      </p>
    </>
  );
}
