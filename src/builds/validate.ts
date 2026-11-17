import { CATALOG, findSpec, type Build, type BuildItem } from '../catalog';
import type { PartId } from '../data/parts';
import { t } from '../i18n';
import { SINGLE_KINDS } from './resolve';

export type Validation = { ok: true; build: Build } | { ok: false; errors: string[] };

const KINDS = Object.keys(CATALOG) as PartId[];
const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/** Checks untrusted JSON (localStorage, file import) against the Build format and the catalog. Never throws. */
export function validateBuild(raw: unknown): Validation {
  const errors: string[] = [];
  if (!isObj(raw)) return { ok: false, errors: [t('menu.validate.notObject')] };
  // Builds saved before the rename carry `subtitle`.
  const { subtitle, ...rest } = raw;
  const input: Record<string, unknown> = raw.description === undefined && subtitle !== undefined ? { ...rest, description: subtitle } : raw;
  if (input.version !== 1) errors.push(t('menu.validate.version'));
  if (typeof input.id !== 'string' || !input.id.trim()) errors.push(t('menu.validate.idMissing'));
  if (typeof input.name !== 'string' || !input.name.trim()) errors.push(t('menu.validate.nameMissing'));
  if (input.description !== undefined && typeof input.description !== 'string' && !isObj(input.description)) errors.push(t('menu.validate.description'));

  const parts = input.parts;
  if (!isObj(parts)) {
    errors.push(t('menu.validate.partsMissing'));
    return { ok: false, errors };
  }
  for (const kind of KINDS) {
    const items = parts[kind];
    if (!Array.isArray(items) || items.length === 0) {
      errors.push(t('menu.validate.kindEmpty', { kind }));
      continue;
    }
    items.forEach((it: BuildItem) => {
      if (!isObj(it) || typeof it.spec !== 'string' || !Number.isInteger(it.qty) || it.qty < 1) {
        errors.push(t('menu.validate.itemShape', { kind }));
        return;
      }
      const spec = findSpec(it.spec);
      if (!spec) errors.push(t('menu.validate.unknownPart', { kind, spec: it.spec }));
      else if (spec.kind !== kind) errors.push(t('menu.validate.wrongKind', { kind, spec: it.spec, specKind: spec.kind }));
    });
    if ((SINGLE_KINDS as readonly string[]).includes(kind) && (items.length !== 1 || items[0]?.qty !== 1)) {
      errors.push(t('menu.validate.singleKind', { kind }));
    }
  }
  return errors.length ? { ok: false, errors } : { ok: true, build: input as unknown as Build };
}
