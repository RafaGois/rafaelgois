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
import { GLTFLoader }  from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { configureGltfSceneMaterials } from './configure-gltf-materials.js';

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
renderer.toneMappingExposure = 1.1;

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

// ─── Helper: normaliza escala e centraliza corretamente ───────────────────────
// Ordem obrigatória: escala primeiro → recalcula bbox escalada → aplica posição.
// Se a escala for aplicada depois, o deslocamento posição×escala desloca o modelo
// para fora do frustum (ex.: modelos Sketchfab com geometria centrada em y ≈ 45).
function fitModel(model, targetSize) {
  const box0  = new THREE.Box3().setFromObject(model);
  const size  = box0.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  if (!maxDim || !isFinite(maxDim)) return;

  model.scale.setScalar(targetSize / maxDim);

  const box1 = new THREE.Box3().setFromObject(model);
  const ctr  = box1.getCenter(new THREE.Vector3());
  model.position.set(-ctr.x, -ctr.y, -ctr.z);
}

// ─── Grupos ───────────────────────────────────────────────────────────────────
const cubeGroup = new THREE.Group();

cubeGroup.position.set(0.5, 1.8, 0);

scene.add(cubeGroup);

let cubeLoaded = false;

const rad   = THREE.MathUtils.degToRad;
const draco = new DRACOLoader();
draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/libs/draco/');
const loader = new GLTFLoader();
loader.setDRACOLoader(draco);

// ── head_of_david_but_with_hay.glb — superior ────────────────────────────────
loader.load('./head_of_david_but_with_hay.glb', (gltf) => {
  const model = gltf.scene;
  fitModel(model, 0.7);
  configureGltfSceneMaterials(model);

  cubeGroup.rotation.set(rad(-15), rad(35), rad(-8));
  cubeGroup.add(model);
  cubeLoaded = true;
}, undefined, (e) => console.error('[box-right-3d] head_of_david_hay:', e));

// ─── Scroll progress (0 → 1 conforme #box passa) ─────────────────────────────
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

  sX += (tX - sX) * 0.05;
  sY += (tY - sY) * 0.05;

  const p = scrollProgress;

  if (cubeLoaded) {
    const scrollRotY = p * rad(200);
    cubeGroup.rotation.x = rad(-15) + sY * 0.15 + Math.sin(t * 0.38) * 0.022;
    cubeGroup.rotation.y = rad(35)  + scrollRotY - sX * 0.20 + Math.sin(t * 0.28) * 0.028;
    cubeGroup.rotation.z = rad(-8)  - sX * 0.04;
    cubeGroup.position.y = 1.8 + Math.sin(t * 0.46) * 0.10;
    cubeGroup.position.x = 0.5 + Math.sin(t * 0.31) * 0.06;
  }

  renderer.render(scene, camera);
}

animate();
