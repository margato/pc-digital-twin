import * as THREE from 'three';

/**
 * Colours and light intensities were tuned under three's legacy pipeline (no colour management,
 * legacy lights). Keep this import first in main.tsx; upgrading to r165+ needs a full lighting retune.
 */
THREE.ColorManagement.enabled = false;

export const isMobile =
  typeof navigator !== 'undefined' &&
  (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
