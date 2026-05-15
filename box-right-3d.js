/**
 * box-right-3d.js — lado direito da dobra "Pensando fora da caixa"
 *
 * Modelos flutuando ao redor do box central + imagem:
 *   Superior:  flower_pot.glb          (0.7 u, y ≈ +1.8, x ≈ +0.5)
 *   Meio:      block_shape_abstract.glb (1.5 u, y ≈ +0.1, x ≈ -0.5)
 *   Inferior:  diamond.glb              (1.4 u, y ≈ -1.7, x ≈ +0.4)
 *
 * Câmera: FOV 48°, z = 6
 * ScrollTrigger: progresso do scroll rotaciona cada modelo no eixo Y (scrub).
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const container = document.getElementById('box-left-3d');
if (!container) throw new Error('[box-left-3d] container não encontrado');

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
renderer.toneMappingExposure = 1.2;

// ─── Scene & Camera ───────────────────────────────────────────────────────────
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

// ─── Iluminação ───────────────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0xf5f2ee, 2.2));

const key = new THREE.DirectionalLight(0xffffff, 4.5);
key.position.set(4, 7, 6);
scene.add(key);

const fill = new THREE.DirectionalLight(0xd0dcea, 1.8);
fill.position.set(-5, 2, 3);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xfff8f0, 1.2);
rim.position.set(0, -4, 5);
scene.add(rim);

// ─── Grupos ───────────────────────────────────────────────────────────────────
const cubeGroup  = new THREE.Group();
const blockGroup = new THREE.Group();
const potGroup   = new THREE.Group();

// Posições base — distribuídas para cobrir o lado direito ao redor do box central
cubeGroup.position.set( 0.5,  1.8, 0);
blockGroup.position.set(-0.5,  0.1, 0);
potGroup.position.set( -0.5, -0.6, 0);

scene.add(cubeGroup);
scene.add(blockGroup);
scene.add(potGroup);

let cubeLoaded  = false;
let blockLoaded = false;
let potLoaded   = false;

const rad    = THREE.MathUtils.degToRad;
const loader = new GLTFLoader();

// ── cube_transparent_artistic_reference.glb — superior ───────────────────────
loader.load('./flower_pot.glb', (gltf) => {
  const model = gltf.scene;
  const box   = new THREE.Box3().setFromObject(model);
  const ctr   = box.getCenter(new THREE.Vector3());
  const size  = box.getSize(new THREE.Vector3());
  model.position.sub(ctr);
  model.scale.setScalar(0.7 / Math.max(size.x, size.y, size.z));

  model.traverse((c) => {
    if (!c.isMesh) return;
    c.castShadow = c.receiveShadow = true;
    const mats = Array.isArray(c.material) ? c.material : [c.material];
    mats.forEach((m) => {
      if (!m) return;
      // Preserve transparência do modelo artístico
      if (m.transparent) m.transparent = true;
      m.needsUpdate = true;
    });
  });

  // Pose inicial — ângulo de 3/4
  cubeGroup.rotation.set(rad(-15), rad(35), rad(-8));
  cubeGroup.add(model);
  cubeLoaded = true;
}, undefined, (e) => console.error('[box-right-3d] cube_transparent:', e));

// ── block_shape_abstract.glb — meio ──────────────────────────────────────────
loader.load('./block_shape_abstract.glb', (gltf) => {
  const model = gltf.scene;
  const box   = new THREE.Box3().setFromObject(model);
  const ctr   = box.getCenter(new THREE.Vector3());
  const size  = box.getSize(new THREE.Vector3());
  model.position.sub(ctr);
  model.scale.setScalar(1.5 / Math.max(size.x, size.y, size.z));

  model.traverse((c) => { if (c.isMesh) c.castShadow = c.receiveShadow = true; });

  // Pose: inclinação diferente para criar variação visual
  blockGroup.rotation.set(rad(10), rad(-25), rad(5));
  blockGroup.add(model);
  blockLoaded = true;
}, undefined, (e) => console.error('[box-right-3d] block_shape:', e));

// ── flower_pot.glb — inferior ─────────────────────────────────────────────────
loader.load('./diamond.glb', (gltf) => {
  const model = gltf.scene;
  const box   = new THREE.Box3().setFromObject(model);
  const ctr   = box.getCenter(new THREE.Vector3());
  const size  = box.getSize(new THREE.Vector3());
  model.position.sub(ctr);
  model.scale.setScalar(0.85 / Math.max(size.x, size.y, size.z));

  model.traverse((c) => { if (c.isMesh) c.castShadow = c.receiveShadow = true; });

  potGroup.rotation.set(rad(8), rad(20), rad(-4));
  potGroup.add(model);
  potLoaded = true;
}, undefined, (e) => console.error('[box-right-3d] diamond:', e));

// ─── Scroll progress (0 → 1 conforme #box passa) ─────────────────────────────
// Atualizado via ScrollTrigger quando disponível; fallback = 0
let scrollProgress = 0;

function setupScroll() {
  if (!window.gsap || !window.ScrollTrigger) {
    requestAnimationFrame(setupScroll);
    return;
  }
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  // Proxy para capturar o progresso do scroll de forma limpa
  const proxy = { p: 0 };

  ScrollTrigger.create({
    trigger:  '#box',
    start:    'top bottom',
    end:      'bottom top',
    scrub:    true,
    onUpdate: (self) => {
      scrollProgress = self.progress;
    },
  });

  // Fade in/out do canvas
  const boxEl = document.getElementById('box');
  if (boxEl) {
    const rect = boxEl.getBoundingClientRect();
    canvas.style.opacity = (rect.top < window.innerHeight && rect.bottom > 0) ? '1' : '0';
  }

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

// ─── Mouse parallax ───────────────────────────────────────────────────────────
let tX = 0, tY = 0, sX = 0, sY = 0;

document.addEventListener('mousemove', (e) => {
  tX = (e.clientX / window.innerWidth  - 0.5) * 2;
  tY = (e.clientY / window.innerHeight - 0.5) * 2;
});

// ─── Render loop ──────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // Lerp suave do mouse
  sX += (tX - sX) * 0.05;
  sY += (tY - sY) * 0.05;

  // Rotação base ligada ao scroll: cada modelo tem multiplicador e fase distintos
  // p = 0 quando #box entra; p = 1 quando #box sai do viewport
  const p = scrollProgress;

  if (cubeLoaded) {
    // Roda ~200° no eixo Y ao longo do scroll; fase +0 graus
    const scrollRotY = p * rad(200);
    cubeGroup.rotation.x = rad(-15) + sY * 0.15 + Math.sin(t * 0.38) * 0.022;
    cubeGroup.rotation.y = rad(35)  + scrollRotY - sX * 0.20 + Math.sin(t * 0.28) * 0.028;
    cubeGroup.rotation.z = rad(-8)  - sX * 0.04;
    cubeGroup.position.y = 1.8 + Math.sin(t * 0.46) * 0.10;
    cubeGroup.position.x = 0.5 + Math.sin(t * 0.31) * 0.06;
  }

  if (blockLoaded) {
    // Roda ~160° com fase oposta — cria divergência visual entre os 3 modelos
    const scrollRotY = p * rad(-160);
    blockGroup.rotation.x = rad(10) + sY * 0.10 + Math.sin(t * 0.33) * 0.018;
    blockGroup.rotation.y = rad(-25) + scrollRotY - sX * 0.14 + Math.sin(t * 0.25) * 0.024;
    blockGroup.rotation.z = rad(5)   + sX * 0.03;
    blockGroup.position.y = 0.1  + Math.sin(t * 0.46 + Math.PI * 0.6) * 0.08;
    blockGroup.position.x = -0.5 + Math.sin(t * 0.27) * 0.05;
  }

  if (potLoaded) {
    // Roda ~240° — mais dinâmico, fase intermediária
    const scrollRotY = p * rad(240);
    potGroup.rotation.x = rad(8)  + sY * 0.12 + Math.sin(t * 0.41) * 0.020;
    potGroup.rotation.y = rad(20) + scrollRotY - sX * 0.16 + Math.sin(t * 0.22) * 0.026;
    potGroup.rotation.z = rad(-4) - sX * 0.03;
    potGroup.position.y = -0.6 + Math.sin(t * 0.46 + Math.PI) * 0.09;
    potGroup.position.x = -0.5 + Math.sin(t * 0.35 + 1.0) * 0.06;
  }

  renderer.render(scene, camera);
}

animate();
