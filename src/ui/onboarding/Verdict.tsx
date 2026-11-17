import type { Evaluation } from '../../sim/compat';
import { fmtW, type Level } from '../../sim/power';
import { useT } from '../../i18n';

const TITLE_KEY: Record<Level, 'onboarding.verdict.ok' | 'onboarding.verdict.warn' | 'onboarding.verdict.fail'> = {
  ok: 'onboarding.verdict.ok',
  warn: 'onboarding.verdict.warn',
  fail: 'onboarding.verdict.fail'
};
const TAG_KEY: Record<Level, 'onboarding.verdict.tagOk' | 'onboarding.verdict.tagWarn' | 'onboarding.verdict.tagFail'> = {
  ok: 'onboarding.verdict.tagOk',
  warn: 'onboarding.verdict.tagWarn',
  fail: 'onboarding.verdict.tagFail'
};

/** Verdict badge plus the compatibility checks. `issuesOnly` lists just the warnings and failures. */
export function Verdict({ ev, issuesOnly = false }: { ev: Evaluation; issuesOnly?: boolean }) {
  const t = useT();
  const issues = ev.checks.filter((c) => c.l !== 'ok');
  const shown = issuesOnly ? issues : ev.checks;
  const summary =
    ev.worst === 'fail'
      ? t('onboarding.verdict.summaryFail')
      : t('onboarding.verdict.summaryDraw', { dc: fmtW(ev.P.dc), outlet: fmtW(ev.outlet) });

  return (
    <div className="ob-verdict-wrap">
      <div className={'ob-verdict v-' + ev.worst} role="status">
        <b>{t(TITLE_KEY[ev.worst])}</b>
        <span>{summary}</span>
      </div>
      <p className="ob-count">{t('onboarding.verdict.checks', { pass: ev.checks.length - issues.length, total: ev.checks.length })}</p>
      {shown.length > 0 && (
        <ul className="ob-checks">
          {shown.map((c, i) => (
            <li key={i} className={c.l}>
              <span className="ob-tag">{t(TAG_KEY[c.l])}</span>
              <span>
                <b>{c.label}</b>: {c.text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
