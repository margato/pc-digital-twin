import { useEffect, useState } from 'react';
import { MdMonitor, MdWbSunny, MdDarkMode } from 'react-icons/md';
import { useT } from '../i18n';

type Mode = 'system' | 'light' | 'dark';
const KEY = 'theme';
const MODES: Mode[] = ['system', 'light', 'dark'];

function readMode(): Mode {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'light' || v === 'dark') return v;
  } catch {
    /* storage unavailable */
  }
  return 'system';
}

function apply(m: Mode) {
  const el = document.documentElement;
  if (m === 'system') delete el.dataset.theme;
  else el.dataset.theme = m;
}

const ICONS: Record<Mode, JSX.Element> = {
  system: <MdMonitor size={16} />,
  light: <MdWbSunny size={16} />,
  dark: <MdDarkMode size={16} />
};

export default function ThemeToggle() {
  const t = useT();
  const [mode, setMode] = useState<Mode>(readMode);
  useEffect(() => {
    apply(mode);
    try {
      if (mode === 'system') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, mode);
    } catch {
      /* storage unavailable */
    }
  }, [mode]);
  return (
    <div className="themetog surf" id="themeToggle" role="group" aria-label={t('panel.theme.group')}>
      {MODES.map((m) => (
        <button key={m} type="button" id={'theme-' + m} aria-pressed={mode === m} aria-label={t(`panel.theme.${m}` as const)} title={t(`panel.theme.${m}` as const)} onClick={() => setMode(m)}>
          {ICONS[m]}
        </button>
      ))}
    </div>
  );
}
