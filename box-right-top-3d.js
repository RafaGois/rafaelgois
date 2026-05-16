/**
 * box-right-top-3d.js — canto superior direito da dobra "Pensando fora da caixa"
 *
 * mouse_arrow — parallax do cursor, sway forte na rotação e deriva ampla na posição
 * (prefers-reduced-motion desliga a deriva).
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { configureGltfSceneMaterials } from './configure-gltf-materials.js';

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
  mouseLoaded = true;
}, undefined, (e) => console.error('[box-right-top-3d] mouse_arrow:', e));

canvas.style.opacity = '1';

function setupScroll() {
  if (!window.gsap || !window.ScrollTrigger) {
    requestAnimationFrame(setupScroll);
    return;
  }
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  const fadeIn  = () => gsap.to(canvas, { opacity: 1, duration: 0.9, ease: 'power2.out' });
  const fadeOut = () => gsap.to(canvas, { opacity: 0, duration: 0.4, ease: 'power1.in'  });

  ScrollTrigger.create({
    trigger:     '#box',
    start:       'top 85%',
    end:         'bottom 15%',
    onEnter:     fadeIn,
    onLeave:     fadeOut,
    onEnterBack: fadeIn,
    onLeaveBack: fadeOut,
  });
}

setupScroll();

let tX = 0, tY = 0, sX = 0, sY = 0;
document.addEventListener('mousemove', (e) => {
  tX = (e.clientX / window.innerWidth  - 0.5) * 2;
  tY = (e.clientY / window.innerHeight - 0.5) * 2;
});

const clock = new THREE.Clock();

const cursorIdleDrift =
  typeof window.matchMedia === 'undefined' ||
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  sX += (tX - sX) * 0.05;
  sY += (tY - sY) * 0.05;

  if (mouseLoaded) {
    mouseGroup.rotation.x =
      rad(-12) + sY * 0.15 + Math.sin(t * 0.58) * 0.11;
    mouseGroup.rotation.y =
      rad(25 + 180) -
      sX * 0.2 +
      Math.sin(t * 0.48) * 0.11 +
      Math.cos(t * 0.39 + 1.1) * 0.062;
    mouseGroup.rotation.z =
      rad(-6) - sX * 0.04 + Math.sin(t * 0.44 + 0.7) * 0.055;

    let driftX = 0;
    let driftY = 0;
    if (cursorIdleDrift) {
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
