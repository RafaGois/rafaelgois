/**
 * box-left-top-3d.js — david_head.glb na dobra "Pensando fora da caixa"
 *
 * Antes em box-left-david2.js (#box-david2-3d). Mesmo comportamento: câmera,
 * materiais, scroll leve, parallax e posição vertical.
 */
import * as THREE from 'three';
import { GLTFLoader }  from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { configureGltfSceneMaterials } from './configure-gltf-materials.js';

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

function fitModel(model, targetSize) {
  const box0   = new THREE.Box3().setFromObject(model);
  const size   = box0.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  if (!maxDim || !isFinite(maxDim)) return;

  model.scale.setScalar(targetSize / maxDim);

  const box1 = new THREE.Box3().setFromObject(model);
  const ctr  = box1.getCenter(new THREE.Vector3());
  model.position.set(-ctr.x, -ctr.y, -ctr.z);
}

const davidGroup = new THREE.Group();
scene.add(davidGroup);

let loaded = false;

const rad = THREE.MathUtils.degToRad;

const BASE_RX = 0;
const BASE_RY = 0;
const BASE_RZ = 0;

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
  loaded = true;
}, undefined, (e) => console.error('[box-left-top-3d] david_head:', e));

let scrollProgress = 0;
canvas.style.opacity = '1';

function setupScroll() {
  if (!window.gsap || !window.ScrollTrigger) {
    requestAnimationFrame(setupScroll);
    return;
  }
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  ScrollTrigger.create({
    trigger:  '#box',
    start:    'top bottom',
    end:      'bottom top',
    scrub:    true,
    onUpdate: (self) => { scrollProgress = self.progress; },
  });

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

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  sX += (tX - sX) * 0.05;
  sY += (tY - sY) * 0.05;

  if (loaded) {
    const p = scrollProgress;
    const scrollRotY = p * rad(12);
    davidGroup.rotation.x = BASE_RX + sY * 0.13 + Math.sin(t * 0.34) * 0.021;
    davidGroup.rotation.y = BASE_RY + scrollRotY - sX * 0.17 + Math.sin(t * 0.26) * 0.024;
    davidGroup.rotation.z = BASE_RZ + sX * 0.03;
    davidGroup.position.y = 1.22 + Math.sin(t * 0.42 + Math.PI * 0.4) * 0.10;
    davidGroup.position.x = Math.sin(t * 0.29 + 0.5) * 0.07;
  }

  renderer.render(scene, camera);
}

animate();
