import { create } from 'zustand';
import { MESSAGES, type MessageKey } from './messages';
import { DEFAULT_LANG, LANGS, type Lang, type LocalizedText } from './types';

export { LANGS, DEFAULT_LANG, type Lang, type LocalizedText } from './types';
export type { MessageKey } from './messages';

const STORAGE_KEY = 'pcdt.lang.v1';

/** First browser language we support wins (`pt-BR` and `pt-PT` -> pt); anything else falls back to English. */
export function detectLang(nav: { languages?: readonly string[]; language?: string } | undefined = typeof navigator === 'undefined' ? undefined : navigator): Lang {
  const prefs = nav?.languages?.length ? nav.languages : nav?.language ? [nav.language] : [];
  for (const p of prefs) {
    const primary = p.toLowerCase().split('-')[0];
    const hit = LANGS.find((l) => l === primary);
    if (hit) return hit;
  }
  return DEFAULT_LANG;
}

function stored(): Lang | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return (LANGS as readonly string[]).includes(v ?? '') ? (v as Lang) : null;
  } catch {
    return null;
  }
}

function applyToDocument(lang: Lang) {
  if (typeof document !== 'undefined') document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
}

interface LangState {
  lang: Lang;
  /** True while the language follows the browser (no saved choice). */
  auto: boolean;
  /** Saves an explicit choice. */
  setLang: (l: Lang) => void;
  /** Forgets the saved choice and follows the browser again. */
  setAuto: () => void;
}

/** The active language: a saved choice if there is one, otherwise the browser's. */
export const useLang = create<LangState>((set) => ({
  lang: stored() ?? detectLang(),
  auto: stored() === null,
  setAuto: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage unavailable */
    }
    const lang = detectLang();
    applyToDocument(lang);
    set({ lang, auto: true });
  },
  setLang: (lang) => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* storage unavailable: the choice lasts for this session only */
    }
    applyToDocument(lang);
    set({ lang, auto: false });
  }
}));
applyToDocument(useLang.getState().lang);

export const getLang = (): Lang => useLang.getState().lang;
export const setLang = (lang: Lang) => useLang.getState().setLang(lang);

export type Params = Record<string, string | number>;

function translate(lang: Lang, key: MessageKey, params?: Params): string {
  const text = MESSAGES[lang][key] ?? MESSAGES[DEFAULT_LANG][key] ?? key;
  return params ? text.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m)) : text;
}

/** Translates with the active language; `{name}` placeholders are filled from `params`. For code outside React (sim, rows). */
export function t(key: MessageKey, params?: Params): string {
  return translate(getLang(), key, params);
}

/** For components: re-renders when the language changes. The returned function changes identity per language, so it is a valid memo dependency. */
export function useT(): typeof t {
  const lang = useLang((s) => s.lang);
  return (key, params) => translate(lang, key, params);
}

/** Picks the text for a language from a LocalizedText, falling back to English, then to any available language. */
export function localize(text: LocalizedText | undefined, lang: Lang = getLang()): string {
  if (text === undefined) return '';
  if (typeof text === 'string') return text;
  return text[lang] ?? text[DEFAULT_LANG] ?? Object.values(text)[0] ?? '';
}

/** Locale for number and date formatting. */
export const localeOf = (lang: Lang = getLang()) => (lang === 'pt' ? 'pt-BR' : 'en-US');
