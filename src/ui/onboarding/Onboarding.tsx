import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import type { Build, BuildItem } from '../../catalog';
import type { PartId } from '../../data/parts';
import { useApp } from '../../state/store';
import { localize, useT } from '../../i18n';
import { LiveBuild } from './LiveBuild';
import { PickStep } from './PickStep';
import { Review } from './Review';
import { KINDS, hasChoice, isComplete, kindLabel, newBuildId, normalize, parseImport, withPart, type Candidate } from './model';
import './onboarding.css';

type View = { name: 'welcome' } | { name: 'import' } | { name: 'pick'; i: number } | { name: 'review' };

const FOCUSABLE =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

/** Onboarding wizard: explore the demo, build a PC step by step, or import one. Renders nothing while closed. */
export default function Onboarding() {
  const open = useApp((s) => s.onboardingOpen);
  return open ? <Wizard /> : null;
}

function Wizard() {
  const t = useT();
  const closeOnboarding = useApp((s) => s.closeOnboarding);
  const [view, setView] = useState<View>({ name: 'welcome' });
  const [id, setId] = useState(newBuildId);
  const [parts, setParts] = useState<Candidate>({});
  const [name, setName] = useState(t('onboarding.defaultName'));
  const [description, setDescription] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const focusedOnce = useRef(false);

  const viewKey = view.name === 'pick' ? `pick-${view.i}` : view.name;
  useEffect(() => {
    // The dialog takes focus on open; every later step moves focus to its heading.
    if (!focusedOnce.current) {
      focusedOnce.current = true;
      dialogRef.current?.focus();
    } else {
      titleRef.current?.focus();
    }
  }, [viewKey]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeOnboarding();
        return;
      }
      const dialog = dialogRef.current;
      if (e.key !== 'Tab' || !dialog) return;
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      const active = document.activeElement;
      if (!dialog.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && (active === first || active === dialog)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeOnboarding]);

  const setKind = (kind: PartId, items: BuildItem[]) => setParts((p) => withPart(p, kind, items));

  const onImported = (build: Build) => {
    setId(newBuildId());
    setParts(normalize(build.parts));
    setName(build.name);
    setDescription(localize(build.description));
    setView({ name: 'review' });
  };

  const back = () => {
    if (view.name === 'pick') setView(view.i > 0 ? { name: 'pick', i: view.i - 1 } : { name: 'welcome' });
    else if (view.name === 'review') setView({ name: 'pick', i: KINDS.length - 1 });
    else setView({ name: 'welcome' });
  };

  const next = () => {
    if (view.name !== 'pick') return;
    setView(view.i < KINDS.length - 1 ? { name: 'pick', i: view.i + 1 } : { name: 'review' });
  };

  const title =
    view.name === 'welcome'
      ? t('onboarding.title.welcome')
      : view.name === 'import'
        ? t('onboarding.title.import')
        : view.name === 'review'
          ? t('onboarding.title.review')
          : t('onboarding.title.step', { n: view.i + 1, total: KINDS.length, label: kindLabel(KINDS[view.i]) });

  return (
    <div className="ob-scrim">
      <div className="ob-dialog" role="dialog" aria-modal="true" aria-labelledby="ob-title" tabIndex={-1} ref={dialogRef}>
        <header className="ob-head">
          <h2 id="ob-title" className="ob-title" tabIndex={-1} ref={titleRef}>
            {title}
          </h2>
          <button type="button" className="ob-link ob-skip" onClick={() => closeOnboarding()}>
            {t('onboarding.skip')}
          </button>
        </header>

        {view.name !== 'welcome' && <Stepper view={view} parts={parts} onGo={setView} />}

        <div className="ob-body">
          {view.name === 'welcome' && (
            <div className="ob-choices">
              <button type="button" className="ob-choice" onClick={() => closeOnboarding()}>
                <span className="ob-choice-t">{t('onboarding.choice.demo.title')}</span>
                <span className="ob-choice-d">{t('onboarding.choice.demo.desc')}</span>
              </button>
              <button type="button" className="ob-choice" onClick={() => setView({ name: 'pick', i: 0 })}>
                <span className="ob-choice-t">{t('onboarding.choice.build.title')}</span>
                <span className="ob-choice-d">{t('onboarding.choice.build.desc')}</span>
              </button>
              <button type="button" className="ob-choice" onClick={() => setView({ name: 'import' })}>
                <span className="ob-choice-t">{t('onboarding.choice.import.title')}</span>
                <span className="ob-choice-d">{t('onboarding.choice.import.desc')}</span>
              </button>
            </div>
          )}

          {view.name === 'import' && <ImportStep onBuild={onImported} />}

          {view.name === 'pick' && (
            <div className="ob-layout">
              <div className="ob-main">
                <PickStep key={KINDS[view.i]} kind={KINDS[view.i]} parts={parts} onChange={setKind} />
              </div>
              <LiveBuild parts={parts} />
            </div>
          )}

          {view.name === 'review' &&
            (isComplete(parts) ? (
              <Review
                id={id}
                parts={parts}
                name={name}
                description={description}
                onName={setName}
                onDescription={setDescription}
                onJump={(i) => setView({ name: 'pick', i })}
              />
            ) : (
              <p className="ob-note">{t('onboarding.missingParts')}</p>
            ))}
        </div>

        {view.name !== 'welcome' && (
          <footer className="ob-nav">
            <button type="button" className="ob-btn" onClick={back}>
              {t('onboarding.nav.back')}
            </button>
            {view.name === 'pick' && (
              <button
                type="button"
                className="ob-btn ob-btn-primary"
                disabled={!hasChoice(parts, KINDS[view.i])}
                onClick={next}
              >
                {view.i < KINDS.length - 1 ? t('onboarding.nav.next') : t('onboarding.nav.review')}
              </button>
            )}
          </footer>
        )}
      </div>
    </div>
  );
}

/** Step list above the body. Every step can be revisited; Review opens once the build is complete. */
function Stepper({ view, parts, onGo }: { view: Exclude<View, { name: 'welcome' }>; parts: Candidate; onGo: (v: View) => void }) {
  const t = useT();
  const current = view.name === 'pick' ? view.i : view.name === 'review' ? KINDS.length : -1;
  const complete = isComplete(parts);
  return (
    <nav aria-label={t('onboarding.stepper.label')}>
      <ol className="ob-steps">
        {KINDS.map((k, i) => {
          const done = hasChoice(parts, k);
          return (
            <li key={k}>
              <button
                type="button"
                className={'ob-step' + (done ? ' is-done' : '')}
                aria-current={i === current ? 'step' : undefined}
                onClick={() => onGo({ name: 'pick', i })}
              >
                <span className="ob-step-n">{i + 1}</span>
                {kindLabel(k)}
                {done && <span className="ob-sr"> {t('onboarding.stepper.picked')}</span>}
              </button>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            className="ob-step"
            disabled={!complete}
            aria-current={current === KINDS.length ? 'step' : undefined}
            onClick={() => onGo({ name: 'review' })}
          >
            {t('onboarding.nav.review')}
          </button>
        </li>
      </ol>
    </nav>
  );
}

function ImportStep({ onBuild }: { onBuild: (b: Build) => void }) {
  const t = useT();
  const [text, setText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // so choosing the same file again still fires
    if (!file) return;
    try {
      setText(await file.text());
      setErrors([]);
    } catch {
      setErrors([t('onboarding.import.readError')]);
    }
  };

  const check = () => {
    const r = parseImport(text);
    if (!r.ok) {
      setErrors(r.errors);
      return;
    }
    setErrors([]);
    onBuild(r.build);
  };

  return (
    <div className="ob-import">
      <p className="ob-lead">{t('onboarding.import.lead')}</p>
      <label className="ob-field">
        <span>{t('onboarding.import.field')}</span>
        <textarea
          className="ob-textarea"
          rows={8}
          spellCheck={false}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>
      <div className="ob-row">
        <label className="ob-btn ob-file">
          {t('onboarding.import.choose')}
          <input type="file" accept=".json,application/json" className="ob-sr" onChange={onFile} />
        </label>
        <button type="button" className="ob-btn ob-btn-primary" onClick={check}>
          {t('onboarding.import.check')}
        </button>
      </div>
      {errors.length > 0 && (
        <div className="ob-errors" role="alert">
          <p>{t('onboarding.import.errorsTitle')}</p>
          <ul>
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
