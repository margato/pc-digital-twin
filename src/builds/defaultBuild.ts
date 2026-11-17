import type { Build } from '../catalog';
import raw from './default.build.json';
import { DEFAULT_ID } from './repository';
import { validateBuild } from './validate';

const checked = validateBuild(raw);
if (!checked.ok) throw new Error('default.build.json is invalid: ' + checked.errors.join(' '));
if (checked.build.id !== DEFAULT_ID) throw new Error(`default.build.json must have id "${DEFAULT_ID}"`);

/** The author's PC, loaded from `default.build.json`. */
export const DEFAULT_BUILD: Build = checked.build;
