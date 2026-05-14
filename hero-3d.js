import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const container = document.getElementById('hero-3d-container');
const canvas = document.getElementById('hero-canvas');

if (!container || !canvas) throw new Error('[hero-3d] elements not found');

// ─── Renderer ────────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ─── Scene ────────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();

// ─── Camera — alta, olhando ligeiramente para baixo ──────────────────────────
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
camera.position.set(0, 1.2, 6.0);
camera.lookAt(0, 0, 0);

function resize() {
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (w === 0 || h === 0) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
resize();

// ─── Iluminação — neutra e elegante, paleta #EDEDED ──────────────────────────
const ambient = new THREE.AmbientLight(0xf0ede8, 2.2);
scene.add(ambient);

const key = new THREE.DirectionalLight(0xffffff, 2.4);
key.position.set(3, 6, 5);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.near = 0.5;
key.shadow.camera.far = 30;
key.shadow.camera.left = -5;
key.shadow.camera.right = 5;
key.shadow.camera.top = 5;
key.shadow.camera.bottom = -5;
key.shadow.bias = -0.0005;
scene.add(key);

const fill = new THREE.DirectionalLight(0xc8d4e8, 0.8);
fill.position.set(-5, 2, -3);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xffffff, 0.3);
rim.position.set(0, -5, -5);
scene.add(rim);

// ─── Pose base (diagonal + inclinado para mostrar as teclas) ─────────────────
// Y: diagonal — teclado rotacionado ~40° no eixo vertical
// X: inclinação — parte superior (teclas de função) caída para trás
const BASE_ROT_Y = THREE.MathUtils.degToRad(40);
const BASE_ROT_X = THREE.MathUtils.degToRad(-36);

// ─── Model Group ──────────────────────────────────────────────────────────────
const modelGroup = new THREE.Group();
scene.add(modelGroup);

let model = null;

// ─── GLTF + Draco ─────────────────────────────────────────────────────────────
const draco = new DRACOLoader();
draco.setDecoderPath(
  'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/libs/draco/'
);

const loader = new GLTFLoader();
loader.setDRACOLoader(draco);

loader.load(
  './keyboard.glb',
  (gltf) => {
    model = gltf.scene;

    // Centralizar e normalizar escala
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    model.position.sub(center);
    model.scale.setScalar(3.2 / maxDim);

    // Leve roll para não parecer "travado"
    model.rotation.z = THREE.MathUtils.degToRad(-3);

    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    modelGroup.add(model);
    canvas.classList.add('hero-canvas--loaded');
  },
  undefined,
  (err) => console.error('[hero-3d] Failed to load keyboard.glb:', err)
);

// ─── Input ────────────────────────────────────────────────────────────────────
let targetMouseX = 0;
let targetMouseY = 0;
let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (e) => {
  targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
  targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});

let scrollProgress = 0;
window.addEventListener('scroll', () => {
  scrollProgress = Math.min(window.scrollY / window.innerHeight, 1);
}, { passive: true });

// ─── Visibilidade — para render quando hero sai de tela ──────────────────────
let heroVisible = true;
new IntersectionObserver(
  (entries) => { heroVisible = entries[0].isIntersecting; },
  { threshold: 0 }
).observe(document.querySelector('header'));

// ─── Loop de render ───────────────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  if (!heroVisible) return;

  const t = clock.getElapsedTime();

  // Smooth mouse parallax
  mouseX += (targetMouseX - mouseX) * 0.03;
  mouseY += (targetMouseY - mouseY) * 0.03;

  // Pose final: base + respiração suave + parallax do mouse
  modelGroup.rotation.y = BASE_ROT_Y
    + Math.sin(t * 0.28) * 0.025   // oscilação lenta Y ±1.4°
    + mouseX * 0.06;                // parallax horizontal ±3.4°

  modelGroup.rotation.x = BASE_ROT_X
    + Math.sin(t * 0.19) * 0.015   // oscilação lenta X ±0.9°
    + mouseY * 0.04;                // parallax vertical ±2.3°

  // Float suave — sobe e desce ~9cm na escala da cena
  modelGroup.position.y = Math.sin(t * 0.6) * 0.09;

  // Scroll: teclado recua e afunda levemente conforme o usuário desce
  modelGroup.position.z  = -scrollProgress * 2.5;
  modelGroup.position.y -= scrollProgress * 0.6;
  modelGroup.rotation.x += scrollProgress * 0.35;

  renderer.render(scene, camera);
}

animate();

// ─── Resize ───────────────────────────────────────────────────────────────────
new ResizeObserver(resize).observe(container);
