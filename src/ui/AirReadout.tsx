import { TOP_FAN_MODE } from '../data/scenarios';
import { useT, type MessageKey } from '../i18n';
import { SCEN_LABEL } from '../i18n/messages/power';
import { airReadout } from '../sim/airflow';
import { useApp } from '../state/store';

const PRESSURE: Record<'positive' | 'negative' | 'balanced', { name: MessageKey; tip: MessageKey; cls: string }> = {
  positive: { name: 'power.air.positive.name', tip: 'power.air.positive.tip', cls: 'ok' },
  negative: { name: 'power.air.negative.name', tip: 'power.air.negative.tip', cls: 'warn' },
  balanced: { name: 'power.air.balanced.name', tip: 'power.air.balanced.tip', cls: 'ok' }
};

export default function AirReadout() {
  const t = useT();
  const on = useApp((s) => s.airOn);
  const scen = useApp((s) => s.scen);
  const S = useApp((s) => s.scenarios[scen]);
  const psuW = useApp((s) => s.resolved.psu.wattage);
  const r = airReadout(S, TOP_FAN_MODE, psuW);
  const max = Math.max(r.intake, r.exhaust, 1);
  const pr = PRESSURE[r.pressure];
  return (
    <div className="air-read surf" id="airRead" hidden={!on} role="region" aria-label={t('power.air.aria')}>
      <div className="ar-head">
        <b>{t('power.airflow')}</b>
        <span className="ar-scen">{t(SCEN_LABEL[scen])}</span>
      </div>

      <div className="ar-bars">
        <div className="ar-row">
          <span className="ar-k"><i className="ar-dot in" />{t('power.air.intake')}</span>
          <div className="ar-track"><i className="in" style={{ width: (r.intake / max) * 100 + '%' }} /></div>
          <b>{r.intake}<small> CFM</small></b>
        </div>
        <div className="ar-row">
          <span className="ar-k"><i className="ar-dot out" />{t('power.air.exhaust')}</span>
          <div className="ar-track"><i className="out" style={{ width: (r.exhaust / max) * 100 + '%' }} /></div>
          <b>{r.exhaust}<small> CFM</small></b>
        </div>
      </div>

      <div className={'ar-press s-' + pr.cls}>
        <b>{t(pr.name)}</b>
        <span>{t(pr.tip)}</span>
      </div>

      <div className="ar-loops">
        <div className="ar-loop">
          <span className="ar-k">{t('power.air.gpuLoop')}</span>
          {r.gpu.cfm > 0 ? (
            <b>{r.gpu.cfm} CFM <small>{t('power.air.gpuExhaust', { temp: Math.round(r.gpu.exhaustTemp) })}</small></b>
          ) : (
            <b className="off">{t('power.air.gpuStopped')} <small>{t('power.air.gpuPassive')}</small></b>
          )}
        </div>
        <div className="ar-loop">
          <span className="ar-k">{t('power.air.psuLoop')}</span>
          {r.psu.fanOn ? <b>{r.psu.cfm} CFM <small>{t('power.air.psuFloor')}</small></b> : <b className="off">{t('power.air.psuOff')} <small>{t('power.air.psuSemi')}</small></b>}
        </div>
      </div>

      <details className="ar-more">
        <summary>{t('power.air.how')}</summary>
        <p>
          {t(TOP_FAN_MODE === 'intake' ? 'power.air.modeIntake' : 'power.air.modeExhaust')}
        </p>
        <p>{t('power.air.recirc')}</p>
        <p>{t('power.air.assumed')}</p>
      </details>
    </div>
  );
}
