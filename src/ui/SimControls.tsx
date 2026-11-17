import { MdAir, MdRestartAlt, MdThermostat } from 'react-icons/md';
import { FEATURES } from '../config/features';
import { SCEN_IDS } from '../data/scenarios';
import { useT } from '../i18n';
import { SCEN_LABEL } from '../i18n/messages/power';
import { useApp } from '../state/store';

export default function SimControls() {
  const t = useT();
  const scen = useApp((s) => s.scen);
  const setScen = useApp((s) => s.setScen);
  const airOn = useApp((s) => s.airOn);
  const heatOn = useApp((s) => s.heatOn);
  const setAir = useApp((s) => s.setAir);
  const setHeat = useApp((s) => s.setHeat);
  const resetView = useApp((s) => s.resetView);
  const part = useApp((s) => s.part);
  const viewDirty = useApp((s) => s.viewDirty);
  const changed = viewDirty || part !== null || scen !== 'gaming' || airOn || heatOn;
  return (
    <div className="sim" role="group" aria-label={t('power.sim.aria')}>
      <div className="mini surf" id="scenSeg" role="group" aria-label={t('power.scenario.aria')}>
        {SCEN_IDS.map((k) => (
          <button key={k} type="button" id={'sc-' + k} aria-pressed={scen === k} onClick={() => setScen(k)}>
            {t(SCEN_LABEL[k])}
          </button>
        ))}
      </div>
      {FEATURES.airflow ? (
        <button className="chipT surf" id="airBtn" type="button" aria-pressed={airOn} onClick={() => setAir(!airOn)}>
          <MdAir aria-hidden="true" />
          {t('power.airflow')}
        </button>
      ) : null}
      {FEATURES.heatmap ? (
        <button className="chipT surf" id="heatBtn" type="button" aria-pressed={heatOn} onClick={() => setHeat(!heatOn)}>
          <MdThermostat aria-hidden="true" />
          {t('power.heatmap')}
        </button>
      ) : null}
      <button className="chipT surf reset" id="resetViewBtn" type="button" disabled={!changed} onClick={resetView} title={t('power.reset.title', { scenario: t(SCEN_LABEL.gaming) })}>
        <MdRestartAlt aria-hidden="true" />
        {t('power.reset')}
      </button>
    </div>
  );
}
