/**
 * box-left-top-3d.js — david_head.glb na dobra "Pensando fora da caixa"
 *
 * Antes em box-left-david2.js (#box-david2-3d). Mesmo comportamento: câmera,
 * materiais, scroll leve, parallax e posição vertical.
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

const container = document.getElementById('box-left-top-3d');
if (!container) throw new Error('[box-left-top-3d] container não encontrado');

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
camera.position.set(0, 0, 5);
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

const davidGroup = new THREE.Group();
scene.add(davidGroup);

let loaded = false;
/** @type {THREE.AnimationMixer | null} */
let gltfMixer = null;

const BASE_RX = 0;
const BASE_RY = 0;
const BASE_RZ = 0;

const rad = THREE.MathUtils.degToRad;

const draco = new DRACOLoader();
draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/libs/draco/');
const loader = new GLTFLoader();
loader.setDRACOLoader(draco);

loader.load(`./${encodeURIComponent('david_head.glb')}`, (gltf) => {
  const model = gltf.scene;
  fitModel(model, 1.6);
  configureGltfSceneMaterials(model);

  davidGroup.rotation.set(BASE_RX, BASE_RY, BASE_RZ);
  davidGroup.add(model);
  gltfMixer = createOptionalAnimationMixer(model, gltf.animations);
  loaded = true;
}, undefined, (e) => console.error('[box-left-top-3d] david_head:', e));

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

  if (loaded) {
    const p = scrollState.progress;
    const scrollRotY = p * rad(12);
    davidGroup.rotation.x = BASE_RX + sY * 0.13 + Math.sin(t * 0.34) * 0.021 * idleA;
    davidGroup.rotation.y = BASE_RY + scrollRotY - sX * 0.17 + Math.sin(t * 0.26) * 0.024 * idleA;
    davidGroup.rotation.z = BASE_RZ + sX * 0.03;
    davidGroup.position.y = 1.22 + Math.sin(t * 0.42 + Math.PI * 0.4) * 0.10 * idleA;
    davidGroup.position.x = Math.sin(t * 0.29 + 0.5) * 0.07 * idleA;
  }

  renderer.render(scene, camera);
}

animate();
