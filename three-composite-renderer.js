/**
 * Um WebGLRenderer + um canvas em tela cheia; cada módulo registra scene/camera/viewport.
 */
import * as THREE from 'three';
import {
  createWebGLRenderer,
  getEffectivePixelRatio,
} from './three-bootstrap.js';

/** @typedef {{
 *   id: string,
 *   scene: THREE.Scene,
 *   camera: THREE.PerspectiveCamera,
 *   getContainer: () => Element | null,
 *   isInView: () => boolean,
 *   update?: (dt: number, t: number) => void,
 *   getOpacity?: () => number,
 *   zIndex?: number,
 *   toneMappingExposure?: number,
 * }} RenderLayer
 */

/** @type {Map<string, RenderLayer>} */
const layers = new Map();

/** @type {import('three').WebGLRenderer | null} */
let renderer = null;
/** @type {THREE.Clock | null} */
let clock = null;
let loopStarted = false;

function getCanvas() {
  return document.getElementById('three-composite-canvas');
}

function resizeComposite() {
  if (!renderer) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w < 1 || h < 1) return;
  renderer.setSize(w, h, false);
  renderer.setPixelRatio(getEffectivePixelRatio());
}

function initCompositeRenderer() {
  if (renderer) return renderer;

  const canvas = getCanvas();
  if (!canvas) {
    throw new Error('[three-composite] #three-composite-canvas não encontrado');
  }

  renderer = createWebGLRenderer(canvas, { shadows: true, toneMappingExposure: 1 });
  clock = new THREE.Clock();

  resizeComposite();
  window.addEventListener('resize', resizeComposite);

  return renderer;
}

/**
 * @param {RenderLayer} layer
 * @returns {() => void} unregister
 */
export function registerRenderLayer(layer) {
  initCompositeRenderer();
  layers.set(layer.id, layer);
  startCompositeLoop();

  return () => {
    layers.delete(layer.id);
  };
}

function startCompositeLoop() {
  if (loopStarted) return;
  loopStarted = true;

  function frame() {
    requestAnimationFrame(frame);
    if (!renderer || !clock) return;

    const active = [...layers.values()]
      .filter((layer) => layer.isInView())
      .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));

    if (active.length === 0) {
      clock.getDelta();
      return;
    }

    const dt = clock.getDelta();
    const t = clock.getElapsedTime();
    const canvasW = renderer.domElement.clientWidth;
    const canvasH = renderer.domElement.clientHeight;

    renderer.setScissorTest(true);
    renderer.setClearColor(0x000000, 0);
    renderer.autoClear = true;
    renderer.clear(true, true, true);

    for (const layer of active) {
      const el = layer.getContainer();
      if (!el) continue;

      const rect = el.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) continue;

      const opacity = layer.getOpacity?.() ?? 1;
      if (opacity < 0.001) continue;

      // Coordenadas em px CSS (mesmo espaço de setSize); ver webgl_multiple_views no Three.js.
      if (rect.bottom < 0 || rect.top > canvasH || rect.right < 0 || rect.left > canvasW) {
        continue;
      }

      const left = Math.floor(rect.left);
      const bottom = Math.floor(canvasH - rect.bottom);
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);
      if (w < 1 || h < 1) continue;

      layer.update?.(dt, t);

      renderer.setScissor(left, bottom, w, h);
      renderer.setViewport(left, bottom, w, h);
      renderer.clear(false, true, false);

      if (layer.toneMappingExposure != null) {
        renderer.toneMappingExposure = layer.toneMappingExposure;
      }

      layer.camera.aspect = rect.width / rect.height;
      layer.camera.updateProjectionMatrix();

      renderer.autoClear = false;
      renderer.render(layer.scene, layer.camera);
    }

    renderer.setScissorTest(false);
    renderer.autoClear = true;
  }

  frame();
}
