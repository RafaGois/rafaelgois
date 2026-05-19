/**
 * box-right-mouse.js — lado direito da dobra "Pensando fora da caixa"
 * Meio: code.glb (2.0 u, y ≈ -1.55)
 *
 * mouse_arrow.glb → box-right-top-3d.js
 * retro_computer__low.glb → box-right-bottom-3d.js
 */
import * as THREE from 'three';
import { loadBoxGltf } from './gltf-load-queue.js';
import { registerRenderLayer } from './three-composite-renderer.js';
import { configureGltfSceneMaterials } from './configure-gltf-materials.js';
import {
  PointerSmoother,
  animationMixerMaybeUpdate,
  createOptionalAnimationMixer,
  motionIdleAmp,
  motionPointerAmp,
  createRenderVisibilityWatcher,
} from './three-motion-helpers.js';
import { setupBoxFoldScrollTriggers } from './three-box-scroll.js';

const container = document.getElementById('box-right-3d');
if (!container) throw new Error('[box-right-mouse] container não encontrado');

const renderVisibility = createRenderVisibilityWatcher(container);
const fade = { opacity: 1 };

// ─── Scene & Camera ───────────────────────────────────────────────────────────
const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
camera.position.set(0, 0, 8);
camera.lookAt(0, 0, 0);

// ─── Iluminação ───────────────────────────────────────────────────────────────
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

// ─── Grupos ───────────────────────────────────────────────────────────────────
const pcGroup = new THREE.Group();
pcGroup.position.set(0.62, -1.55, 0);
scene.add(pcGroup);

let pcLoaded = false;
/** @type {THREE.AnimationMixer | null} */
let gltfMixer = null;
const rad = THREE.MathUtils.degToRad;

loadBoxGltf('./code.glb', (gltf) => {
  const model = gltf.scene;
  const box   = new THREE.Box3().setFromObject(model);
  const ctr   = box.getCenter(new THREE.Vector3());
  const size  = box.getSize(new THREE.Vector3());
  model.position.sub(ctr);
  model.scale.setScalar(2.0 / Math.max(size.x, size.y, size.z));

  configureGltfSceneMaterials(model);

  pcGroup.rotation.set(rad(15), rad(-30), rad(0));
  pcGroup.add(model);
  gltfMixer = createOptionalAnimationMixer(model, gltf.animations);
  pcLoaded = true;
}, undefined, (e) => console.error('[box-right-mouse] code:', e));

// ─── Scroll progress ──────────────────────────────────────────────────────────
const scrollState = { progress: 0 };

setupBoxFoldScrollTriggers({ fade, bindScrollScrub: true, scrollState });

// ─── Mouse parallax ───────────────────────────────────────────────────────────
let pointerTargetX = 0;
let pointerTargetY = 0;
const pointerSmoother = new PointerSmoother();

document.addEventListener('mousemove', (e) => {
  pointerTargetX = (e.clientX / window.innerWidth  - 0.5) * 2;
  pointerTargetY = (e.clientY / window.innerHeight - 0.5) * 2;
});

registerRenderLayer({
  id: 'box-right-3d',
  scene,
  camera,
  getContainer: () => container,
  isInView: () => renderVisibility.isInView(),
  getOpacity: () => fade.opacity,
  zIndex: 5,
  toneMappingExposure: 1.1,
  update(dt, t) {
    animationMixerMaybeUpdate(gltfMixer, dt);
    pointerSmoother.update(pointerTargetX, pointerTargetY, dt);

    const idleA = motionIdleAmp();
    const ptrA  = motionPointerAmp();
    const sX = pointerSmoother.x * ptrA;
    const sY = pointerSmoother.y * ptrA;

    if (pcLoaded) {
      const scrollProgress = scrollState.progress;
      const scrollRotY = scrollProgress * rad(-150);
      pcGroup.rotation.x = rad(15) + sY * 0.12 + Math.sin(t * 0.30) * 0.020 * idleA;
      pcGroup.rotation.y = rad(-30) + scrollRotY - sX * 0.16 + Math.sin(t * 0.23) * 0.025 * idleA;
      pcGroup.rotation.z = sX * 0.03;
      pcGroup.position.y = -1.55 + Math.sin(t * 0.48 + Math.PI) * 0.08 * idleA;
      pcGroup.position.x = 0.62 + Math.sin(t * 0.33) * 0.05 * idleA;
    }
  },
});
