import { fmtW } from '../../sim/power';
import { useT } from '../../i18n';
import { Verdict } from './Verdict';
import { KINDS, describeKind, drawOf, evaluateParts, hasChoice, isComplete, kindLabel, type Candidate } from './model';

/** Side panel with the running build: what is picked, the estimated draw, and the verdict once every part is in. */
export function LiveBuild({ parts }: { parts: Candidate }) {
  const t = useT();
  const picked = KINDS.filter((k) => hasChoice(parts, k)).length;
  const draw = drawOf(parts);
  const total = Object.values(draw).reduce((n, w) => n + w, 0);
  const verdict = isComplete(parts) ? evaluateParts(parts) : null;

  return (
    <aside className="ob-live" aria-label={t('onboarding.live.region')}>
      <h3 className="ob-live-h">
        {t('onboarding.live.title')} <span className="ob-count">{t('onboarding.live.picked', { picked, total: KINDS.length })}</span>
      </h3>
      <ul className="ob-live-list">
        {KINDS.map((k) => {
          const text = describeKind(parts, k);
          return (
            <li key={k} className={text ? undefined : 'ob-empty'}>
              <span className="ob-live-k">{kindLabel(k)}</span>
              <span className="ob-live-v">{text || t('onboarding.live.notYet')}</span>
            </li>
          );
        })}
      </ul>
      <p className="ob-live-draw">
        <span>{t('onboarding.live.draw')}</span>
        <b>{picked ? fmtW(total) : '–'}</b>
      </p>
      {verdict === null ? (
        <p className="ob-note">{t('onboarding.live.verdictPending')}</p>
      ) : verdict.ok ? (
        <Verdict ev={verdict.ev} issuesOnly />
      ) : (
        <p className="ob-errors">{verdict.errors.join(' ')}</p>
      )}
    </aside>
  );
}
