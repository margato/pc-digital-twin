/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import featuresDev from './src/config/features.dev.json';
import featuresProd from './src/config/features.prod.json';
import { FEATURE_NAMES, featureConstant, parseFeatures } from './src/config/featureNames';

// Validate both files on every run so a typo in the one you are not using still fails fast.
const FLAGS = { production: parseFeatures(featuresProd, 'features.prod.json'), development: parseFeatures(featuresDev, 'features.dev.json') };

/** Production builds use features.prod.json; dev server, tests and `--mode development` use features.dev.json. */
const featureDefines = (mode: string) => {
  const flags = mode === 'production' ? FLAGS.production : FLAGS.development;
  // One constant per feature, replaced at build time so disabled code is dropped from the bundle.
  return Object.fromEntries(FEATURE_NAMES.map((n) => [featureConstant(n), JSON.stringify(flags[n])]));
};

// Relative base: dist/ works from any domain or sub-path (GitHub Pages, a custom domain, a static folder).
// There is no client-side router. Set BASE_PATH only to force an absolute base (e.g. a CDN prefix).
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: loadEnv(mode, '.', '').BASE_PATH || './',
  define: featureDefines(mode),
  build: { chunkSizeWarningLimit: 1200 },
  optimizeDeps: { entries: ['index.html'] },
  test: { environment: 'node', include: ['src/**/*.test.ts'] }
}));
