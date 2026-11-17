import { useMemo } from 'react';
import type { Build } from '../../catalog';
import { useApp } from '../../state/store';
import { validateBuild } from '../../builds';
import { useT } from '../../i18n';
import { Verdict } from './Verdict';
import { KINDS, describeKind, evaluateParts, kindLabel, toBuild, type Parts } from './model';

interface Props {
  id: string;
  parts: Parts;
  name: string;
  description: string;
  onName: (name: string) => void;
  onDescription: (description: string) => void;
  /** Jumps back to a wizard step (index into KINDS). */
  onJump: (index: number) => void;
}

/** Final step: name the PC, check the summary and the full compatibility result, then save. */
export function Review({ id, parts, name, description, onName, onDescription, onJump }: Props) {
  const t = useT();
  const build: Build = toBuild(id, name, description, parts);
  const saved = validateBuild(build);
  const verdict = useMemo(() => evaluateParts(parts), [parts]);
  const nameMissing = !name.trim();
  // The name has its own message above, so leave it out of the list.
  const problems = saved.ok ? [] : saved.errors.filter((e) => e !== t('menu.validate.nameMissing'));

  const save = () => {
    if (saved.ok) useApp.getState().saveBuild(saved.build);
  };

  return (
    <div className="ob-review">
      <div className="ob-fields">
        <label className="ob-field">
          <span>
            {t('onboarding.review.name')} <em>{t('onboarding.review.required')}</em>
          </span>
          <input
            className="ob-input"
            value={name}
            maxLength={60}
            onChange={(e) => onName(e.target.value)}
            aria-invalid={nameMissing || undefined}
            aria-describedby={nameMissing ? 'ob-name-err' : undefined}
          />
        </label>
        {nameMissing && (
          <p id="ob-name-err" className="ob-field-err">
            {t('onboarding.review.nameError')}
          </p>
        )}
        <label className="ob-field">
          <span>
            {t('onboarding.review.description')} <em>{t('onboarding.review.optional')}</em>
          </span>
          <input className="ob-input" value={description} maxLength={80} onChange={(e) => onDescription(e.target.value)} />
        </label>
      </div>

      <section aria-labelledby="ob-sum-h">
        <h3 id="ob-sum-h" className="ob-h3">
          {t('onboarding.review.parts')}
        </h3>
        <ol className="ob-summary">
          {KINDS.map((k, i) => (
            <li key={k}>
              <span className="ob-sum-k">{kindLabel(k)}</span>
              <span className="ob-sum-v">{describeKind(parts, k)}</span>
              <button type="button" className="ob-link" onClick={() => onJump(i)}>
                {t('onboarding.review.change')}
                <span className="ob-sr"> {kindLabel(k)}</span>
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="ob-check-h">
        <h3 id="ob-check-h" className="ob-h3">
          {t('onboarding.review.compatibility')}
        </h3>
        {verdict.ok ? <Verdict ev={verdict.ev} /> : <p className="ob-errors">{verdict.errors.join(' ')}</p>}
      </section>

      {problems.length > 0 && (
        <div className="ob-errors" role="alert">
          <p>{t('onboarding.review.fixBeforeSave')}</p>
          <ul>
            {problems.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="ob-actions">
        <button type="button" className="ob-btn ob-btn-primary" disabled={!saved.ok} onClick={save}>
          {t('onboarding.review.save')}
        </button>
      </div>
    </div>
  );
}
