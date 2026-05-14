import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const container = document.getElementById('hero-3d-container');
const canvas    = document.getElementById('hero-canvas');

if (!container || !canvas) throw new Error('[hero-3d] elements not found');

// ─── Renderer ─────────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace    = THREE.SRGBColorSpace;
renderer.toneMapping         = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled   = true;
renderer.shadowMap.type      = THREE.PCFSoftShadowMap;

// ─── Scene ────────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();

// ─── Camera ───────────────────────────────────────────────────────────────────
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

// ─── Iluminação ───────────────────────────────────────────────────────────────
const ambient = new THREE.AmbientLight(0xf0ede8, 2.2);
scene.add(ambient);

const key = new THREE.DirectionalLight(0xffffff, 2.4);
key.position.set(3, 6, 5);
key.castShadow           = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.near   = 0.5;
key.shadow.camera.far    = 30;
key.shadow.camera.left   = -5;
key.shadow.camera.right  = 5;
key.shadow.camera.top    = 5;
key.shadow.camera.bottom = -5;
key.shadow.bias          = -0.0005;
scene.add(key);

const fill = new THREE.DirectionalLight(0xc8d4e8, 0.8);
fill.position.set(-5, 2, -3);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xffffff, 0.3);
rim.position.set(0, -5, -5);
scene.add(rim);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const rad = THREE.MathUtils.degToRad;

// Pose inicial: diagonal pronunciada, teclas visíveis sem ficar reto
const BASE_ROT_Y = rad(48);
const BASE_ROT_X = rad(55);

// ─── Estado animado ───────────────────────────────────────────────────────────
// GSAP tweena estes valores; o RAF do Three.js lê e aplica a cada frame.
const pose = {
  rotY:    BASE_ROT_Y,
  rotX:    BASE_ROT_X,
  posX:    0,
  posY:    0,
  posZ:    0,
  scale:   1,
  opacity: 0,     // sobe para 1 via GSAP quando o modelo termina de carregar
};

// ─── Model ────────────────────────────────────────────────────────────────────
const modelGroup = new THREE.Group();
scene.add(modelGroup);

let modelLoaded = false;

const draco = new DRACOLoader();
draco.setDecoderPath(
  'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/libs/draco/'
);

const loader = new GLTFLoader();
loader.setDRACOLoader(draco);

loader.load(
  './keyboard.glb',
  (gltf) => {
    const model  = gltf.scene;
    const box    = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size   = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    model.position.sub(center);
    model.scale.setScalar(3.2 / maxDim);
    model.rotation.z = rad(-14);

    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow    = true;
        child.receiveShadow = true;
      }
    });

    modelGroup.add(model);
    modelLoaded = true;
  },
  undefined,
  (err) => console.error('[hero-3d] Failed to load keyboard.glb:', err)
);

// ─── Input — mouse parallax ───────────────────────────────────────────────────
let targetMouseX = 0, targetMouseY = 0;
let mouseX       = 0, mouseY       = 0;

document.addEventListener('mousemove', (e) => {
  targetMouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
  targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});

// ─── Render loop ──────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const t = clock.getElapsedTime();

  // Smooth mouse follow
  mouseX += (targetMouseX - mouseX) * 0.03;
  mouseY += (targetMouseY - mouseY) * 0.03;

  // Parallax reduz proporcionalmente ao scale — menos distração nas seções inferiores
  const p = pose.scale;

  modelGroup.rotation.y = pose.rotY
    + Math.sin(t * 0.28) * 0.025
    + mouseX * 0.06 * p;

  modelGroup.rotation.x = pose.rotX
    + Math.sin(t * 0.19) * 0.015
    + mouseY * 0.04 * p;

  modelGroup.position.set(
    pose.posX,
    pose.posY + Math.sin(t * 0.6) * 0.09,
    pose.posZ,
  );

  modelGroup.scale.setScalar(pose.scale);

  canvas.style.opacity = String(pose.opacity);

  renderer.render(scene, camera);
}

animate();

// ─── Scroll animations ────────────────────────────────────────────────────────
// Aguarda GSAP + ScrollTrigger serem carregados (scripts defer no HTML)
// e o modelo estar pronto, depois registra todas as animações.
function setupScrollAnimations() {
  if (!window.gsap || !window.ScrollTrigger) {
    requestAnimationFrame(setupScrollAnimations);
    return;
  }

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  // Fade de entrada: aguarda o modelo e então sobe opacity de 0 → 1
  const waitEntry = () => {
    if (!modelLoaded) { requestAnimationFrame(waitEntry); return; }
    gsap.to(pose, { opacity: 1, duration: 1.8, ease: 'power2.out' });
  };
  waitEntry();

  // Configuração padrão para as transições entre seções
  const trigger = (id, scrub = 1.5) => ({
    trigger:        id,
    start:          'top bottom',  // inicia quando o topo da seção entra pelo rodapé
    end:            'top top',     // termina quando o topo da seção chega no topo
    scrub,
  });

  // ─── Hero → About ─────────────────────────────────────────────────────────
  // Teclado desliza para a direita e fica menos inclinado
  gsap.fromTo(pose,
    { rotY: rad(48),  rotX: rad(55),  posX: 0,    posY: 0,    posZ: 0,    scale: 1.00 },
    { rotY: rad(15),  rotX: rad(-18), posX: 1.8,  posY: -0.3, posZ: -1.2, scale: 0.88,
      immediateRender: false,
      scrollTrigger: trigger('#about'),
    }
  );

  // ─── About → Box ──────────────────────────────────────────────────────────
  // Teclado some para a direita (seção "box" é puramente visual)
  gsap.fromTo(pose,
    { rotY: rad(15),  rotX: rad(-18), posX: 1.8,  posY: -0.3, posZ: -1.2, scale: 0.88, opacity: 1 },
    { rotY: rad(10),  rotX: rad(-12), posX: 2.5,  posY: -0.5, posZ: -2.0, scale: 0.80, opacity: 0,
      immediateRender: false,
      scrollTrigger: trigger('#box', 1),
    }
  );

  // ─── Box → Skills ─────────────────────────────────────────────────────────
  // Teclado reaparece pela esquerda em pose overhead (invisível → visível)
  gsap.fromTo(pose,
    { rotY: rad(-30), rotX: rad(-48), posX: -2.5, posY: 0.3,  posZ: -0.8, scale: 0.82, opacity: 0 },
    { rotY: rad(-30), rotX: rad(-48), posX: -1.6, posY: 0.3,  posZ: -0.8, scale: 0.82, opacity: 1,
      immediateRender: false,
      scrollTrigger: trigger('#skills', 1),
    }
  );

  // ─── Skills → Projects ────────────────────────────────────────────────────
  // Teclado centraliza em perspectiva mais baixa
  gsap.fromTo(pose,
    { rotY: rad(-30), rotX: rad(-48), posX: -1.6, posY: 0.3,  posZ: -0.8, scale: 0.82, opacity: 1 },
    { rotY: rad(5),   rotX: rad(-22), posX: 0.6,  posY: -0.6, posZ: -1.0, scale: 0.78, opacity: 1,
      immediateRender: false,
      scrollTrigger: trigger('#projects'),
    }
  );

  // ─── Projects → Services ──────────────────────────────────────────────────
  // Teclado recua e desvanece — não distrai nas seções finais
  gsap.fromTo(pose,
    { rotY: rad(5),  rotX: rad(-22), posX: 0.6, posY: -0.6, posZ: -1.0, scale: 0.78, opacity: 1 },
    { rotY: rad(5),  rotX: rad(-22), posX: 0.6, posY: -0.6, posZ: -3.0, scale: 0.70, opacity: 0,
      immediateRender: false,
      scrollTrigger: trigger('#services', 1),
    }
  );
}

setupScrollAnimations();

// ─── Resize ───────────────────────────────────────────────────────────────────
new ResizeObserver(resize).observe(container);
