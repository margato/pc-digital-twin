import type { Build } from '../catalog/types/build';
import { DEFAULT_ID } from '../builds/repository';
import { t } from '../i18n';

/** Lowercase ASCII slug of a build name, "pc" when nothing usable is left. */
export function slugify(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'pc';
}

/** Download name for a build: `<slug>.pc.json`. */
export function exportFileName(build: Pick<Build, 'name'>): string {
  return `${slugify(build.name)}.pc.json`;
}

/** The exported file content: the build as pretty JSON. */
export function buildJson(build: Build): string {
  return JSON.stringify(build, null, 2);
}

/** Question shown by the inline two-step confirms. */
export function confirmText(kind: 'delete' | 'reset', name?: string): string {
  if (kind === 'reset') return t('menu.confirm.reset');
  return t('menu.confirm.delete', { name: name ?? '' });
}

/** True when the build is the built-in Default (read-only, no delete). */
export function isDefaultBuild(build: Pick<Build, 'id'>): boolean {
  return build.id === DEFAULT_ID;
}

/** Reset only makes sense once a user build exists. */
export function hasUserBuilds(builds: readonly Pick<Build, 'id'>[]): boolean {
  return builds.some((b) => !isDefaultBuild(b));
}
