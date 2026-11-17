/**
 * Feature toggles. There are two files with the same keys (edit them: true shows a feature, false removes it):
 *   features.prod.json  used by `npm run build` / `npm run preview` (mode "production")
 *   features.dev.json   used by `npm run dev`, tests and any other mode, e.g. `vite build --mode development`
 * They are read when the app is BUILT, so a disabled feature is not in the bundle.
 * Restart the dev server or rebuild after changing a file.
 *
 *   onboarding      the first-run wizard and the "Create or import my PC" action
 *   buildMenu       the "My PCs" selector in the top bar
 *   aboutButton     the About button
 *   themeToggle     the light / dark switch
 *   settingsButton  the Settings button (only shown if at least one setting below is on)
 *   languageSetting the language choice inside Settings (Auto / English / Portuguese)
 *   fpsLimit        the FPS limiter and its setting inside Settings
 *   simControls     the Idle / Gaming / Stress buttons (and the airflow / heatmap toggles, which also need their own flag below)
 *   airflow         the Airflow toggle, the airflow readout and the airflow particles
 *   heatmap         the Heatmap toggle, its legend and the heat tint / slice
 *   cameraControls  the zoom and rotate buttons
 *   upgradesTab     the Upgrades tab of the side panel
 *
 * This file is plain TypeScript with no imports so `vite.config.ts` can use it.
 */
export const FEATURE_NAMES = [
  'onboarding', 'buildMenu', 'aboutButton', 'themeToggle', 'settingsButton', 'languageSetting', 'fpsLimit', 'simControls', 'airflow', 'heatmap', 'cameraControls', 'upgradesTab'
] as const;

export type FeatureName = (typeof FEATURE_NAMES)[number];
export type FeatureFlags = Record<FeatureName, boolean>;

/** `fpsLimit` -> `__FEATURE_FPS_LIMIT__`: the constant vite injects at build time. */
export const featureConstant = (name: FeatureName) => '__FEATURE_' + name.replace(/([A-Z])/g, '_$1').toUpperCase() + '__';

/** Throws a readable error for unknown names, missing names or non-boolean values. `file` is only used in the message. */
export function parseFeatures(input: unknown, file = 'features.json'): FeatureFlags {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) throw new Error(`${file} must be an object of true/false values.`);
  const obj = input as Record<string, unknown>;
  const problems: string[] = [];
  for (const key of Object.keys(obj)) if (!(FEATURE_NAMES as readonly string[]).includes(key)) problems.push(`unknown feature "${key}"`);
  for (const name of FEATURE_NAMES) {
    if (!(name in obj)) problems.push(`missing "${name}"`);
    else if (typeof obj[name] !== 'boolean') problems.push(`"${name}" must be true or false`);
  }
  if (problems.length) throw new Error(`Invalid src/config/${file}: ` + problems.join('; ') + `. Known features: ${FEATURE_NAMES.join(', ')}.`);
  return obj as FeatureFlags;
}
