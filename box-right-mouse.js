/**
 * box-right-mouse.js — lado direito da dobra "Pensando fora da caixa"
 * Meio: code.glb (2.0 u, y ≈ -1.55)
 *
 * mouse_arrow.glb → box-right-top-3d.js
 * retro_computer__low.glb → box-right-bottom-3d.js
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { configureGltfSceneMaterials } from './configure-gltf-materials.js';
import {
  PointerSmoother,
  animationMixerMaybeUpdate,
  createOptionalAnimationMixer,
  motionIdleAmp,
  motionPointerAmp,
} from './three-motion-helpers.js';
import { setupBoxFoldScrollTriggers } from './three-box-scroll.js';

const container = document.getElementById('box-right-3d');
if (!container) throw new Error('[box-right-mouse] container não encontrado');

// ─── Canvas & Renderer ────────────────────────────────────────────────────────
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

// ─── Scene & Camera ───────────────────────────────────────────────────────────
const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
camera.position.set(0, 0, 8);
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
const rad    = THREE.MathUtils.degToRad;
const draco  = new DRACOLoader();
draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/libs/draco/');
const loader = new GLTFLoader();
loader.setDRACOLoader(draco);

loader.load('./code.glb', (gltf) => {
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
canvas.style.opacity = '1';

setupBoxFoldScrollTriggers({ canvas, bindScrollScrub: true, scrollState });

// ─── Mouse parallax ───────────────────────────────────────────────────────────
let pointerTargetX = 0;
let pointerTargetY = 0;
const pointerSmoother = new PointerSmoother();

document.addEventListener('mousemove', (e) => {
  pointerTargetX = (e.clientX / window.innerWidth  - 0.5) * 2;
  pointerTargetY = (e.clientY / window.innerHeight - 0.5) * 2;
});

// ─── Render loop ──────────────────────────────────────────────────────────────
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

  if (pcLoaded) {
    const scrollProgress = scrollState.progress;
    const scrollRotY = scrollProgress * rad(-150);
    pcGroup.rotation.x = rad(15) + sY * 0.12 + Math.sin(t * 0.30) * 0.020 * idleA;
    pcGroup.rotation.y = rad(-30) + scrollRotY - sX * 0.16 + Math.sin(t * 0.23) * 0.025 * idleA;
    pcGroup.rotation.z = sX * 0.03;
    pcGroup.position.y = -1.55 + Math.sin(t * 0.48 + Math.PI) * 0.08 * idleA;
    pcGroup.position.x = 0.62 + Math.sin(t * 0.33) * 0.05 * idleA;
  }

  renderer.render(scene, camera);
}

animate();
