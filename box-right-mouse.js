/**
 * box-right-mouse.js — lado direito da dobra "Pensando fora da caixa"
 * Exibe mouse_arrow.glb flutuando, com rotação por scroll e mouse parallax.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

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

// ─── Grupo ────────────────────────────────────────────────────────────────────
const mouseGroup = new THREE.Group();
mouseGroup.position.set(0, 1.6, 0);
scene.add(mouseGroup);

let mouseLoaded = false;
const rad    = THREE.MathUtils.degToRad;
const loader = new GLTFLoader();

loader.load('./mouse_arrow.glb', (gltf) => {
  const model = gltf.scene;
  const box   = new THREE.Box3().setFromObject(model);
  const ctr   = box.getCenter(new THREE.Vector3());
  const size  = box.getSize(new THREE.Vector3());
  model.position.sub(ctr);
  model.scale.setScalar(1.1 / Math.max(size.x, size.y, size.z));

  model.traverse((c) => { if (c.isMesh) c.castShadow = c.receiveShadow = true; });

  mouseGroup.rotation.set(rad(-12), rad(25), rad(-6));
  mouseGroup.add(model);
  mouseLoaded = true;
}, undefined, (e) => console.error('[box-right-mouse] mouse_arrow:', e));

// ─── Scroll progress ──────────────────────────────────────────────────────────
let scrollProgress = 0;

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

  sX += (tX - sX) * 0.05;
  sY += (tY - sY) * 0.05;

  if (mouseLoaded) {
    const scrollRotY = scrollProgress * rad(180);
    mouseGroup.rotation.x = rad(-12) + sY * 0.15 + Math.sin(t * 0.35) * 0.025;
    mouseGroup.rotation.y = rad(25)  + scrollRotY - sX * 0.20 + Math.sin(t * 0.27) * 0.030;
    mouseGroup.rotation.z = rad(-6)  - sX * 0.04;
    mouseGroup.position.y = 1.6 + Math.sin(t * 0.48) * 0.09;
  }

  renderer.render(scene, camera);
}

animate();
