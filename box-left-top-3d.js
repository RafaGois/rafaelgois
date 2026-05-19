/**
 * box-left-top-3d.js — david_head.glb na dobra "Pensando fora da caixa"
 *
 * Antes em box-left-david2.js (#box-david2-3d). Mesmo comportamento: câmera,
 * materiais, scroll leve, parallax e posição vertical.
 */
import * as THREE from 'three';
import { loadBoxGltf } from './gltf-load-queue.js';
import { registerRenderLayer } from './three-composite-renderer.js';
import { configureGltfSceneMaterials } from './configure-gltf-materials.js';
import { fitModel } from './three-gltf-layout.js';
import {
  PointerSmoother,
  animationMixerMaybeUpdate,
  createOptionalAnimationMixer,
  motionIdleAmp,
  motionPointerAmp,
  createRenderVisibilityWatcher,
} from './three-motion-helpers.js';
import { setupBoxFoldScrollTriggers } from './three-box-scroll.js';

const container = document.getElementById('box-left-top-3d');
if (!container) throw new Error('[box-left-top-3d] container não encontrado');

const renderVisibility = createRenderVisibilityWatcher(container);
const fade = { opacity: 1 };

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
camera.position.set(0, 0, 5);
camera.lookAt(0, 0, 0);

scene.add(new THREE.AmbientLight(0xf5f2ee, 2.0));

const key = new THREE.DirectionalLight(0xffffff, 4.0);
key.position.set(4, 7, 6);
scene.add(key);

const fill = new THREE.DirectionalLight(0xd0dcea, 1.6);
fill.position.set(-5, 2, 3);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xfff8f0, 1.0);
rim.position.set(0, -4, 5);
scene.add(rim);

const davidGroup = new THREE.Group();
scene.add(davidGroup);

let loaded = false;
/** @type {THREE.AnimationMixer | null} */
let gltfMixer = null;

const BASE_RX = 0;
const BASE_RY = 0;
const BASE_RZ = 0;

const rad = THREE.MathUtils.degToRad;

loadBoxGltf(`./${encodeURIComponent('david_head.glb')}`, (gltf) => {
  const model = gltf.scene;
  fitModel(model, 1.6);
  configureGltfSceneMaterials(model);

  davidGroup.rotation.set(BASE_RX, BASE_RY, BASE_RZ);
  davidGroup.add(model);
  gltfMixer = createOptionalAnimationMixer(model, gltf.animations);
  loaded = true;
}, undefined, (e) => console.error('[box-left-top-3d] david_head:', e));

const scrollState = { progress: 0 };

setupBoxFoldScrollTriggers({ fade, bindScrollScrub: true, scrollState });

let pointerTargetX = 0;
let pointerTargetY = 0;
const pointerSmoother = new PointerSmoother();

document.addEventListener('mousemove', (e) => {
  pointerTargetX = (e.clientX / window.innerWidth  - 0.5) * 2;
  pointerTargetY = (e.clientY / window.innerHeight - 0.5) * 2;
});

registerRenderLayer({
  id: 'box-left-top-3d',
  scene,
  camera,
  getContainer: () => container,
  isInView: () => renderVisibility.isInView(),
  getOpacity: () => fade.opacity,
  zIndex: 6,
  toneMappingExposure: 1.1,
  update(dt, t) {
    animationMixerMaybeUpdate(gltfMixer, dt);
    pointerSmoother.update(pointerTargetX, pointerTargetY, dt);

    const idleA = motionIdleAmp();
    const ptrA  = motionPointerAmp();
    const sX = pointerSmoother.x * ptrA;
    const sY = pointerSmoother.y * ptrA;

    if (loaded) {
      const p = scrollState.progress;
      const scrollRotY = p * rad(12);
      davidGroup.rotation.x = BASE_RX + sY * 0.13 + Math.sin(t * 0.34) * 0.021 * idleA;
      davidGroup.rotation.y = BASE_RY + scrollRotY - sX * 0.17 + Math.sin(t * 0.26) * 0.024 * idleA;
      davidGroup.rotation.z = BASE_RZ + sX * 0.03;
      davidGroup.position.y = 1.22 + Math.sin(t * 0.42 + Math.PI * 0.4) * 0.10 * idleA;
      davidGroup.position.x = Math.sin(t * 0.29 + 0.5) * 0.07 * idleA;
    }
  },
});
