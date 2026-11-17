import type { Lang } from '../types';
import checks from './checks';
import menu from './menu';
import onboarding from './onboarding';
import panel from './panel';
import power from './power';
import rows from './rows';
import whatif from './whatif';

/** Every message area. Add a new file here when a new area of the UI needs text. */
const AREAS = [panel, power, whatif, checks, onboarding, menu, rows] as const;

type KeysOf<A> = A extends { en: infer E } ? keyof E & string : never;
export type MessageKey = KeysOf<(typeof AREAS)[number]>;

export const MESSAGES: Record<Lang, Record<string, string>> = {
  en: Object.assign({}, ...AREAS.map((a) => a.en)),
  pt: Object.assign({}, ...AREAS.map((a) => a.pt))
};
