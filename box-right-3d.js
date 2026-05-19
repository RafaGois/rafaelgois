/**
 * box-right-3d.js — lado esquerdo da dobra "Pensando fora da caixa"
 *
 * Modelos flutuando ao redor do box central + imagem:
 *   Superior:  head_of_david_but_with_hay.glb (0.7 u, y ≈ +1.8, x ≈ +0.5)
 *
 * O modelo inferior (pokebola.glb) está em box-left-bottom-3d.js.
 *
 * Câmera: FOV 48°, z = 6
 * ScrollTrigger: progresso do scroll rotaciona cada modelo no eixo Y (scrub).
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

const container = document.getElementById('box-left-3d');
if (!container) throw new Error('[box-left-3d] container não encontrado');

const renderVisibility = createRenderVisibilityWatcher(container);
const fade = { opacity: 1 };

// ─── Scene & Camera ───────────────────────────────────────────────────────────
const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
camera.position.set(0, 0, 6);
camera.lookAt(0, 0, 0);

// ─── Iluminação (igual ao painel direito — box-right-mouse.js) ───────────────
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
const cubeGroup = new THREE.Group();

cubeGroup.position.set(0.5, 1.8, 0);

scene.add(cubeGroup);

let cubeLoaded = false;
/** @type {THREE.AnimationMixer | null} */
let gltfMixer = null;
const rad = THREE.MathUtils.degToRad;

// ── head_of_david_but_with_hay.glb — superior ────────────────────────────────
loadBoxGltf('./head_of_david_but_with_hay.glb', (gltf) => {
  const model = gltf.scene;
  fitModel(model, 0.7);
  configureGltfSceneMaterials(model);

  cubeGroup.rotation.set(rad(-15), rad(35), rad(-8));
  cubeGroup.add(model);
  gltfMixer = createOptionalAnimationMixer(model, gltf.animations);
  cubeLoaded = true;
}, undefined, (e) => console.error('[box-right-3d] head_of_david_hay:', e));

// ─── Scroll progress (0 → 1 conforme #box passa) ─────────────────────────────
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
  id: 'box-left-3d',
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
    const p = scrollState.progress;

    if (cubeLoaded) {
      const scrollRotY = p * rad(200);
      cubeGroup.rotation.x = rad(-15) + sY * 0.15 + Math.sin(t * 0.38) * 0.022 * idleA;
      cubeGroup.rotation.y = rad(35) + scrollRotY - sX * 0.20 + Math.sin(t * 0.28) * 0.028 * idleA;
      cubeGroup.rotation.z = rad(-8) - sX * 0.04;
      cubeGroup.position.y = 1.8 + Math.sin(t * 0.46) * 0.10 * idleA;
      cubeGroup.position.x = 0.5 + Math.sin(t * 0.31) * 0.06 * idleA;
    }
  },
});
