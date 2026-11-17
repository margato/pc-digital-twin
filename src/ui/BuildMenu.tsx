import { MdCheck, MdComputer, MdKeyboardArrowDown } from 'react-icons/md';
import { useCallback, useEffect, useId, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';
import { FEATURES } from '../config/features';
import { useApp } from '../state/store';
import { useT } from '../i18n';
import type { Build } from '../catalog/types/build';
import { buildJson, confirmText, exportFileName, hasUserBuilds, isDefaultBuild } from './buildMenuHelpers';
import './buildmenu.css';

/** Which inline two-step confirm is open, if any. */
type Confirm = { kind: 'delete'; id: string } | { kind: 'reset' } | null;

/** Saves the build as `<slug>.pc.json` through a temporary link. */
function download(build: Build) {
  const url = URL.createObjectURL(new Blob([buildJson(build)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = exportFileName(build);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const NAV_KEYS = ['ArrowDown', 'ArrowUp', 'Home', 'End'];

function ConfirmRow({ question, yesLabel, onYes, onNo }: { question: string; yesLabel: string; onYes: () => void; onNo: () => void }) {
  const t = useT();
  return (
    <div className="bm-confirm">
      <span role="status">{question}</span>
      <button type="button" className="bm-act bm-yes" onClick={onYes}>
        {yesLabel}
      </button>
      <button type="button" className="bm-act" autoFocus onClick={onNo}>
        {t('menu.no')}
      </button>
    </div>
  );
}

export default function BuildMenu() {
  const t = useT();
  const builds = useApp((s) => s.builds);
  const build = useApp((s) => s.build);
  const selectBuild = useApp((s) => s.selectBuild);
  const removeBuild = useApp((s) => s.removeBuild);
  const resetBuilds = useApp((s) => s.resetBuilds);
  const openOnboarding = useApp((s) => s.openOnboarding);

  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  /** Set when the menu was opened from the keyboard, so the first item takes focus. */
  const focusOnOpen = useRef(false);
  const popId = useId();

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    setConfirm(null);
    if (returnFocus) trigger.current?.focus();
  }, []);

  // Outside click and Escape close the menu while it is open.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) close(false);
    };
    const onEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close(true);
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open, close]);

  // Keyboard openers focus the active build (or the first item) once the list is rendered.
  useEffect(() => {
    if (!open || !focusOnOpen.current) return;
    focusOnOpen.current = false;
    const first = pop.current?.querySelector<HTMLButtonElement>('[aria-current="true"]') ?? pop.current?.querySelector<HTMLButtonElement>('button');
    first?.focus();
  }, [open]);

  const items = (): HTMLButtonElement[] => Array.from(pop.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!NAV_KEYS.includes(e.key)) return;
    if (!open) {
      // Arrow keys on the closed trigger open the menu.
      if (e.target !== trigger.current || e.key === 'Home' || e.key === 'End') return;
      e.preventDefault();
      focusOnOpen.current = true;
      setConfirm(null);
      setOpen(true);
      return;
    }
    const list = items();
    if (list.length === 0) return;
    e.preventDefault();
    const i = list.indexOf(document.activeElement as HTMLButtonElement);
    let next: number;
    if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = list.length - 1;
    else if (e.key === 'ArrowDown') next = i < 0 ? 0 : (i + 1) % list.length;
    else next = i <= 0 ? list.length - 1 : i - 1;
    list[next].focus();
  }

  // Tabbing out of the menu closes it. A null relatedTarget (Safari click on a button) is ignored.
  function onBlur(e: FocusEvent<HTMLDivElement>) {
    if (open && e.relatedTarget && !e.currentTarget.contains(e.relatedTarget as Node)) close(false);
  }

  function toggle() {
    if (open) close(false);
    else {
      setConfirm(null);
      setOpen(true);
    }
  }

  function pick(id: string) {
    if (id === build.id) close(true);
    else {
      selectBuild(id);
      close(true);
    }
  }

  const showReset = hasUserBuilds(builds);

  return (
    <div className="bm" ref={wrap} onKeyDown={onKeyDown} onBlur={onBlur}>
      <button
        ref={trigger}
        type="button"
        className="bm-trigger aboutbtn surf"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={popId}
        title={t('menu.myPcs')}
        onClick={toggle}
      >
        <MdComputer size={16} />
        <span className="bm-name">{build.name}</span>
        <MdKeyboardArrowDown className="bm-chev" aria-hidden="true" />
      </button>

      {open && (
        <div id={popId} ref={pop} className="bm-pop" role="group" aria-label={t('menu.myPcs')}>
          <ul className="bm-list">
            {builds.map((b) => {
              const active = b.id === build.id;
              const isDefault = isDefaultBuild(b);
              const deleting = confirm?.kind === 'delete' && confirm.id === b.id;
              return (
                <li key={b.id} className="bm-item" data-active={active}>
                  <button type="button" className="bm-pick" aria-current={active ? 'true' : undefined} onClick={() => pick(b.id)}>
                    <MdCheck className="bm-check" aria-hidden="true" />
                    <span className="bm-pick-name">{b.name}</span>
                    {isDefault && <span className="bm-badge">{t('menu.default')}</span>}
                    {active && <span className="bm-active">{t('menu.active')}</span>}
                  </button>
                  <div className="bm-actions">
                    {deleting ? (
                      <ConfirmRow
                        question={confirmText('delete', b.name)}
                        yesLabel={t('menu.yes')}
                        onYes={() => {
                          removeBuild(b.id);
                          close(true);
                        }}
                        onNo={() => setConfirm(null)}
                      />
                    ) : (
                      <>
                        <button type="button" className="bm-act" onClick={() => download(b)}>
                          {t('menu.exportJson')}
                        </button>
                        {!isDefault && (
                          <button type="button" className="bm-act bm-danger" onClick={() => setConfirm({ kind: 'delete', id: b.id })}>
                            {t('menu.delete')}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="bm-foot">
            {FEATURES.onboarding ? (
              <button
                type="button"
                className="bm-foot-btn"
                onClick={() => {
                  openOnboarding();
                  close(false);
                }}
              >
                {t('menu.createPc')}
              </button>
            ) : null}
            {showReset &&
              (confirm?.kind === 'reset' ? (
                <div className="bm-foot-confirm">
                  <ConfirmRow
                    question={confirmText('reset')}
                    yesLabel={t('menu.yes')}
                    onYes={() => {
                      resetBuilds();
                      close(true);
                    }}
                    onNo={() => setConfirm(null)}
                  />
                </div>
              ) : (
                <button type="button" className="bm-foot-btn bm-danger" onClick={() => setConfirm({ kind: 'reset' })}>
                  {t('menu.resetDefault')}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
