/**
 * Infraestrutura Three.js compartilhada: loaders singleton e factory do renderer.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

export const DRACO_DECODER_PATH =
  'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/libs/draco/';

export const DEFAULT_PIXEL_RATIO_CAP = 2;

/** Alinhado ao breakpoint `md:` do Tailwind / box-3d-loader. */
export const DESKTOP_MIN_WIDTH_PX = 768;

export function isDesktopViewport() {
  if (typeof window.matchMedia !== 'function') return true;
  return window.matchMedia(`(min-width: ${DESKTOP_MIN_WIDTH_PX}px)`).matches;
}

/** Mobile / Lighthouse: DPR 1; desktop: até 2×. */
export function getEffectivePixelRatio() {
  if (!isDesktopViewport()) return 1;
  return Math.min(window.devicePixelRatio || 1, DEFAULT_PIXEL_RATIO_CAP);
}

/** @type {DRACOLoader | null} */
let dracoLoader = null;
/** @type {GLTFLoader | null} */
let gltfLoader = null;

export function getDracoLoader() {
  if (!dracoLoader) {
    dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
  }
  return dracoLoader;
}

export function getGltfLoader() {
  if (!gltfLoader) {
    gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(getDracoLoader());
  }
  return gltfLoader;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ shadows?: boolean, toneMappingExposure?: number }} [options]
 */
export function createWebGLRenderer(canvas, options = {}) {
  const { shadows = false, toneMappingExposure = 1.0 } = options;
  const desktop = isDesktopViewport();

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: desktop,
    powerPreference: desktop ? 'default' : 'low-power',
  });
  renderer.setPixelRatio(getEffectivePixelRatio());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = toneMappingExposure;

  if (shadows) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  return renderer;
}
