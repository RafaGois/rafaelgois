/**
 * box-left-bottom-3d.js — elemento inferior esquerdo da dobra "Pensando fora da caixa"
 *
 * pokebola.glb (antes em box-right-3d.js / potGroup). Painel próprio, mesmo
 * comportamento: posição, rotação base, scroll, parallax e materiais GLB.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { configureGltfSceneMaterials } from './configure-gltf-materials.js';
import { fitModel } from './three-gltf-layout.js';
import {
  PointerSmoother,
  animationMixerMaybeUpdate,
  createOptionalAnimationMixer,
  motionIdleAmp,
  motionPointerAmp,
} from './three-motion-helpers.js';
import { setupBoxFoldScrollTriggers } from './three-box-scroll.js';

const container = document.getElementById('box-left-bottom-3d');
if (!container) throw new Error('[box-left-bottom-3d] container não encontrado');

const canvas = document.createElement('canvas');
canvas.style.display = 'block';
canvas.style.width   = '100%';
canvas.style.height  = '100%';
container.appendChild(canvas);

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace    = THREE.SRGBColorSpace;
renderer.toneMapping         = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
camera.position.set(0, 0, 6);
camera.lookAt(0, 0, 0);

function applyResize() {
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (!w || !h) return false;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  return true;
}

function resize() {
  if (!applyResize()) setTimeout(() => applyResize(), 100);
}

resize();
window.addEventListener('resize', resize);
if (window.ResizeObserver) new ResizeObserver(resize).observe(container);

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

const potGroup = new THREE.Group();
potGroup.position.set(-0.92, -1.88, 0);
scene.add(potGroup);

let potLoaded = false;
/** @type {THREE.AnimationMixer | null} */
let gltfMixer = null;
const rad   = THREE.MathUtils.degToRad;
const draco = new DRACOLoader();
draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/libs/draco/');
const loader = new GLTFLoader();
loader.setDRACOLoader(draco);

loader.load('./pokebola.glb', (gltf) => {
  const model = gltf.scene;
  fitModel(model, 0.56);
  configureGltfSceneMaterials(model);

  potGroup.rotation.set(rad(8), rad(48), rad(-4));
  potGroup.add(model);
  gltfMixer = createOptionalAnimationMixer(model, gltf.animations);
  potLoaded = true;
}, undefined, (e) => console.error('[box-left-bottom-3d] pokebola:', e));

const scrollState = { progress: 0 };
canvas.style.opacity = '1';

setupBoxFoldScrollTriggers({ canvas, bindScrollScrub: true, scrollState });

let pointerTargetX = 0;
let pointerTargetY = 0;
const pointerSmoother = new PointerSmoother();

document.addEventListener('mousemove', (e) => {
  pointerTargetX = (e.clientX / window.innerWidth  - 0.5) * 2;
  pointerTargetY = (e.clientY / window.innerHeight - 0.5) * 2;
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  const t  = clock.getElapsedTime();

  animationMixerMaybeUpdate(gltfMixer, dt);
  pointerSmoother.update(pointerTargetX, pointerTargetY, dt);

  const idleA = motionIdleAmp();
  const ptrA  = motionPointerAmp();
  const sX = pointerSmoother.x * ptrA;
  const sY = pointerSmoother.y * ptrA;

  const p = scrollState.progress;

  if (potLoaded) {
    potGroup.rotation.x = rad(8) + sY * 0.08 + Math.sin(t * 0.28) * 0.015 * idleA;
    potGroup.rotation.y = rad(48) - sX * 0.10 + Math.sin(t * 0.20) * 0.018 * idleA;
    potGroup.rotation.z = rad(-4) - sX * 0.02;
    potGroup.position.x =
      -0.92 +
      p * 1.4 +
      Math.sin(t * 0.35 + 1.0) * 0.06 * idleA;
    potGroup.position.y =
      -1.88 +
      p * 1.8 +
      Math.sin(t * 0.46 + Math.PI) * 0.09 * idleA;
    potGroup.position.z =
      p * 0.6 +
      Math.sin(t * 0.22) * 0.04 * idleA;
  }

  renderer.render(scene, camera);
}

animate();
