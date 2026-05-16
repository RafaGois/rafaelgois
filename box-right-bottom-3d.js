/**
 * box-right-bottom-3d.js — canto inferior direito da dobra "Pensando fora da caixa"
 *
 * retro_computer__low.glb (antes em box-right-mouse.js). Mesmo comportamento.
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

const container = document.getElementById('box-right-bottom-3d');
if (!container) throw new Error('[box-right-bottom-3d] container não encontrado');

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

const benchGroup = new THREE.Group();
const benchBaseX = 0.88;
benchGroup.position.set(benchBaseX, -2.28, 0);
scene.add(benchGroup);

let benchLoaded = false;
/** @type {THREE.AnimationMixer | null} */
let gltfMixer = null;
const rad   = THREE.MathUtils.degToRad;
const draco = new DRACOLoader();
draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/libs/draco/');
const loader = new GLTFLoader();
loader.setDRACOLoader(draco);

loader.load('./retro_computer__low.glb', (gltf) => {
  const model = gltf.scene;
  const box   = new THREE.Box3().setFromObject(model);
  const ctr   = box.getCenter(new THREE.Vector3());
  const size  = box.getSize(new THREE.Vector3());
  const maxD  = Math.max(size.x, size.y, size.z, 1e-6);
  model.position.sub(ctr);
  model.scale.setScalar(1.55 / maxD);

  configureGltfSceneMaterials(model);

  benchGroup.rotation.set(rad(12), rad(-22), rad(0));
  benchGroup.add(model);
  gltfMixer = createOptionalAnimationMixer(model, gltf.animations);
  benchLoaded = true;
}, undefined, (e) => console.error('[box-right-bottom-3d] retro_computer:', e));

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

  if (benchLoaded) {
    const scrollRotY = scrollState.progress * rad(130);
    benchGroup.rotation.x = rad(12) + sY * 0.10 + Math.sin(t * 0.29) * 0.018 * idleA;
    benchGroup.rotation.y = rad(-22) + scrollRotY - sX * 0.14 + Math.sin(t * 0.21) * 0.022 * idleA;
    benchGroup.rotation.z = sX * 0.025;
    benchGroup.position.y = -2.28 + Math.sin(t * 0.48 + Math.PI * 1.2) * 0.075 * idleA;
    benchGroup.position.x = benchBaseX + Math.sin(t * 0.30 + 1.4) * 0.045 * idleA;
  }

  renderer.render(scene, camera);
}

animate();
