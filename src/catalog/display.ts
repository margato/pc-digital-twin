import type { PartSpec } from './types';

/**
 * Name to show people: "Intel Core i7-12700K", "ASUS TUF Gaming Z690-Plus D4", "NZXT H7".
 * The maker goes first unless the name already starts with it; the brand (product line) is added only when the name
 * does not already carry it ("Series" is ignored, so "H Series" does not turn "H7" into "H Series H7") and it is not
 * just a repeat of the maker.
 */
export function displayName(spec: Pick<PartSpec, 'manufacturer' | 'brand' | 'name'>): string {
  const name = spec.name.toLowerCase();
  const maker = spec.manufacturer.toLowerCase();
  const line = spec.brand.replace(/\s*series\s*/i, '').trim().toLowerCase();
  const parts: string[] = [];
  if (!name.startsWith(maker)) parts.push(spec.manufacturer);
  if (line && line !== maker && !maker.includes(line) && !name.includes(line)) parts.push(spec.brand);
  parts.push(spec.name);
  return parts.join(' ');
}
