import { localize, useT } from '../i18n';
import { useApp } from '../state/store';

export default function UpgradesSection({ onTry }: { onTry: () => void }) {
  const t = useT();
  const build = useApp((s) => s.build);
  const setAir = useApp((s) => s.setAir);
  const tryUpgrade = useApp((s) => s.tryUpgrade);
  const upgrades = build.upgrades ?? [];
  if (upgrades.length === 0) {
    return <p className="note">{t('whatif.upgrades.none')}</p>;
  }
  return (
    <>
      {build.upgradesNote ? <p className="note">{localize(build.upgradesNote)}</p> : null}
      {upgrades.map((u) => (
        <div className="card" key={u.rank}>
          <div className="top">
            <span className="rank">{'#' + u.rank}</span>
            <strong>{localize(u.title)}</strong>
            <span className={'pill ' + u.cls}>{localize(u.priority)}</span>
          </div>
          <p>{localize(u.why)}</p>
          <div className="meta">
            <span>{t('whatif.upgrades.impact', { value: localize(u.impact) })}</span>
            <span>{t('whatif.upgrades.cost', { value: localize(u.cost) })}</span>
            <span>{t('whatif.upgrades.effort', { value: localize(u.effort) })}</span>
          </div>
          <button
            type="button"
            className="ghost"
            id={'upg-' + u.rank}
            onClick={() => {
              if (u.air) {
                setAir(true);
                return;
              }
              tryUpgrade(u.swap ?? {});
              onTry();
            }}
          >
            {u.air ? t('whatif.upgrades.airflow') : t('whatif.upgrades.try')}
          </button>
        </div>
      ))}
    </>
  );
}
