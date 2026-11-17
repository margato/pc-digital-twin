import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { partRows } from '../builds/rows';
import { useT, useLang } from '../i18n';
import { useApp } from '../state/store';

export default function Dock() {
  const t = useT();
  const part = useApp((s) => s.part);
  const setPart = useApp((s) => s.setPart);
  const togglePart = useApp((s) => s.togglePart);
  const wrapRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLSpanElement>(null);
  const resolved = useApp((s) => s.resolved);
  const lang = useLang((s) => s.lang); // partRows() translates with the active language
  const rows = useMemo(() => partRows(resolved), [resolved, lang]);

  const moveLens = useCallback((scroll: boolean) => {
    const lens = lensRef.current;
    const wrap = wrapRef.current;
    const b = tabsRef.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
    if (!lens || !b) return;
    lens.style.width = b.offsetWidth + 'px';
    lens.style.transform = 'translateX(' + b.offsetLeft + 'px)';
    if (scroll && wrap && b.scrollIntoView && wrap.scrollWidth > wrap.clientWidth) {
      b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }, []);

  useLayoutEffect(() => moveLens(true), [part, moveLens]);
  useEffect(() => {
    const on = () => moveLens(true);
    window.addEventListener('resize', on);
    if (document.fonts && document.fonts.ready) void document.fonts.ready.then(on);
    return () => window.removeEventListener('resize', on);
  }, [moveLens]);

  return (
    <nav className="dock" aria-label={t('panel.dock.label')}>
      <div className="tabwrap" ref={wrapRef}>
        <span className="lens" id="lens" ref={lensRef} aria-hidden="true"></span>
        <div className="tabs" id="tabs" ref={tabsRef} role="group" aria-label={t('panel.dock.label')}>
          <button type="button" id="tab-all" aria-pressed={part === null} onClick={() => setPart(null)}>
            <i>00</i>
            {t('panel.dock.wholePc')}
          </button>
          {rows.map((r, i) => (
            <button key={r.part} type="button" id={'tab-' + r.part} aria-pressed={part === r.part} onClick={() => togglePart(r.part)}>
              <i>{String(i + 1).padStart(2, '0')}</i>
              {r.k}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
