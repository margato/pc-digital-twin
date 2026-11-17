import { describe, expect, it } from 'vitest';
import dev from './features.dev.json';
import prod from './features.prod.json';
import { FEATURE_NAMES, featureConstant, parseFeatures } from './featureNames';
import { FEATURES } from './features';

describe('feature toggles', () => {
  it('both files are valid and list exactly the known features', () => {
    expect(parseFeatures(prod, 'features.prod.json')).toEqual(prod);
    expect(parseFeatures(dev, 'features.dev.json')).toEqual(dev);
    expect(Object.keys(prod).sort()).toEqual([...FEATURE_NAMES].sort());
    expect(Object.keys(dev).sort()).toEqual([...FEATURE_NAMES].sort());
  });
  it('tests run with the dev file (any mode other than production)', () => {
    for (const n of FEATURE_NAMES) expect(FEATURES[n], n).toBe(dev[n]);
  });
  it('rejects unknown, missing and non-boolean flags with a readable message', () => {
    const ok = Object.fromEntries(FEATURE_NAMES.map((n) => [n, true]));
    expect(() => parseFeatures({ ...ok, nope: true }, 'features.prod.json')).toThrow(/Invalid src\/config\/features.prod.json: unknown feature "nope"/);
    expect(() => parseFeatures({ ...ok, onboarding: 'yes' })).toThrow(/"onboarding" must be true or false/);
    const { fpsLimit: _omit, ...missing } = ok;
    expect(() => parseFeatures(missing)).toThrow(/missing "fpsLimit"/);
    expect(() => parseFeatures([])).toThrow();
  });
  it('maps camelCase names to the injected constants', () => {
    expect(featureConstant('fpsLimit')).toBe('__FEATURE_FPS_LIMIT__');
    expect(featureConstant('languageSetting')).toBe('__FEATURE_LANGUAGE_SETTING__');
  });
});
