import { useT } from '../i18n';
import { useApp } from '../state/store';

export default function HeatLegend() {
  const t = useT();
  const on = useApp((s) => s.heatOn);
  return (
    <div className="legend surf" id="legend" hidden={!on}>
      <div>{t('power.heat.legend')}</div>
      <div className="ramp"></div>
      <div className="ticks">
        <span>25 °C</span>
        <span>60 °C</span>
        <span>95 °C</span>
      </div>
    </div>
  );
}
