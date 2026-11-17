import type { FeatureFlags } from './featureNames';

export { FEATURE_NAMES, type FeatureFlags, type FeatureName } from './featureNames';

/**
 * Which features this build ships, from `features.prod.json` (production build) or `features.dev.json` (everything else). Each flag is a compile-time constant, so
 * `FEATURES.x ? <X /> : null` is removed from the bundle when x is false.
 */
export const FEATURES: FeatureFlags = {
  onboarding: __FEATURE_ONBOARDING__,
  buildMenu: __FEATURE_BUILD_MENU__,
  aboutButton: __FEATURE_ABOUT_BUTTON__,
  themeToggle: __FEATURE_THEME_TOGGLE__,
  settingsButton: __FEATURE_SETTINGS_BUTTON__,
  languageSetting: __FEATURE_LANGUAGE_SETTING__,
  fpsLimit: __FEATURE_FPS_LIMIT__,
  simControls: __FEATURE_SIM_CONTROLS__,
  airflow: __FEATURE_AIRFLOW__,
  heatmap: __FEATURE_HEATMAP__,
  cameraControls: __FEATURE_CAMERA_CONTROLS__,
  upgradesTab: __FEATURE_UPGRADES_TAB__
};

/** The Settings button needs at least one setting to show; otherwise the dialog would be empty. */
export const SHOW_SETTINGS = FEATURES.settingsButton && (FEATURES.fpsLimit || FEATURES.languageSetting);
