export const LANGS = ['en', 'pt'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'en';

/** Text that may carry one string per language (used by build JSON, e.g. upgrade suggestions). A plain string is used for every language. */
export type LocalizedText = string | Partial<Record<Lang, string>>;
