/**
 * box-right-top-3d.js — canto superior direito da dobra "Pensando fora da caixa"
 *
 * mouse_arrow — parallax do cursor, sway forte na rotação e deriva ampla na posição
 * (prefers-reduced-motion elimina só a deriva idle de posição; parallax já é atenuado).
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

const container = document.getElementById('box-right-top-3d');
if (!container) throw new Error('[box-right-top-3d] container não encontrado');

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

const mouseGroup = new THREE.Group();
const mouseBaseX = 0.68;
const mouseBaseY = 2.08;
mouseGroup.position.set(mouseBaseX, mouseBaseY, 0);
scene.add(mouseGroup);

let mouseLoaded = false;
/** @type {THREE.AnimationMixer | null} */
let gltfMixer = null;
const rad   = THREE.MathUtils.degToRad;
const draco = new DRACOLoader();
draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/libs/draco/');
const loader = new GLTFLoader();
loader.setDRACOLoader(draco);

loader.load('./mouse_arrow.glb', (gltf) => {
  const model = gltf.scene;
  const box   = new THREE.Box3().setFromObject(model);
  const ctr   = box.getCenter(new THREE.Vector3());
  const size  = box.getSize(new THREE.Vector3());
  model.position.sub(ctr);
  model.scale.setScalar(1.1 / Math.max(size.x, size.y, size.z));

  configureGltfSceneMaterials(model);

  mouseGroup.rotation.set(rad(-12), rad(25 + 180), rad(-6));
  mouseGroup.add(model);
  gltfMixer = createOptionalAnimationMixer(model, gltf.animations);
  mouseLoaded = true;
}, undefined, (e) => console.error('[box-right-top-3d] mouse_arrow:', e));

canvas.style.opacity = '1';

setupBoxFoldScrollTriggers({ canvas, bindScrollScrub: false });

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

  if (mouseLoaded) {
    mouseGroup.rotation.x =
      rad(-12) + sY * 0.15 + Math.sin(t * 0.58) * 0.11 * idleA;
    mouseGroup.rotation.y =
      rad(25 + 180) -
      sX * 0.2 +
      Math.sin(t * 0.48) * 0.11 * idleA +
      Math.cos(t * 0.39 + 1.1) * 0.062 * idleA;
    mouseGroup.rotation.z =
      rad(-6) - sX * 0.04 + Math.sin(t * 0.44 + 0.7) * 0.055 * idleA;

    let driftX = 0;
    let driftY = 0;
    if (idleA > 0) {
      driftX =
        Math.sin(t * 0.52) * 0.46 +
        Math.sin(t * 0.92 + 1.95) * 0.22 +
        Math.cos(t * 0.34) * 0.15;
      driftY =
        Math.cos(t * 0.44) * 0.4 +
        Math.sin(t * 0.74 + 0.95) * 0.2 +
        Math.sin(t * 0.63 + 2.2) * 0.15;
    }
    mouseGroup.position.x = mouseBaseX + driftX;
    mouseGroup.position.y = mouseBaseY + driftY;
  }

  renderer.render(scene, camera);
}

animate();
