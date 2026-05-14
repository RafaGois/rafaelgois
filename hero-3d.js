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

// Pose inicial: diagonal pronunciada, parte traseira (ESC/números) mais recuada
const BASE_ROT_Y = rad(48);
const BASE_ROT_X = rad(64);

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
let keyMeshes   = [];   // todas as keycaps, populadas após carregar o GLB
let baseMeshes  = [];   // case/PCB, ficam fixos

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
    model.rotation.z = rad(-22);

    // ─── Coletar todas as meshes e classificar por volume ───────────────────
    // O case do teclado é a(s) mesh(es) com maior bounding box; o resto são keycaps.
    const meshes = [];
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow    = true;
        child.receiveShadow = true;
        meshes.push(child);
      }
    });

    const withVolume = meshes.map((m) => {
      const b = new THREE.Box3().setFromObject(m);
      const s = b.getSize(new THREE.Vector3());
      return { mesh: m, volume: s.x * s.y * s.z };
    });
    withVolume.sort((a, b) => a.volume - b.volume);

    // Heurística: se há muitas meshes (típico teclado 60+), as 2 maiores são o case.
    // Senão, considera a maior como case.
    const baseCount = withVolume.length > 30 ? 2 : 1;
    keyMeshes  = withVolume.slice(0, withVolume.length - baseCount).map((v) => v.mesh);
    baseMeshes = withVolume.slice(withVolume.length - baseCount).map((v) => v.mesh);

    // Unidade de referência: dimensão típica de uma keycap (mediana) em
    // coordenadas LOCAIS do model — k.position é local, então lift/drift
    // também precisam ser locais para o efeito visual ficar proporcional.
    let unit = 1;
    if (keyMeshes.length > 0) {
      const mid = keyMeshes[Math.floor(keyMeshes.length / 2)];
      if (!mid.geometry.boundingBox) mid.geometry.computeBoundingBox();
      const midSize = mid.geometry.boundingBox.getSize(new THREE.Vector3());
      unit = Math.max(midSize.x, midSize.y, midSize.z) || 1;
    }

    // Cada keycap precisa de material próprio (transparência independente)
    // e parâmetros aleatórios para o "desencaixe".
    keyMeshes.forEach((k) => {
      if (k.material) {
        k.material = Array.isArray(k.material)
          ? k.material.map((m) => m.clone())
          : k.material.clone();
        const mats = Array.isArray(k.material) ? k.material : [k.material];
        mats.forEach((m) => {
          m.transparent = true;
          m.depthWrite  = true;
        });
      }
      k.userData.initialPos = k.position.clone();
      k.userData.initialRot = k.rotation.clone();
      k.userData.lift   = THREE.MathUtils.randFloat(3, 8) * unit;     // 3-8 keycaps de altura
      k.userData.driftX = THREE.MathUtils.randFloatSpread(2) * unit;  // ±1 keycap
      k.userData.driftZ = THREE.MathUtils.randFloatSpread(2) * unit;
      k.userData.tiltX  = THREE.MathUtils.randFloatSpread(1.2);       // ~±35°
      k.userData.tiltZ  = THREE.MathUtils.randFloatSpread(1.2);
      k.userData.tiltY  = THREE.MathUtils.randFloatSpread(1.6);       // spin Y maior
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
// Aguarda GSAP + ScrollTrigger (scripts defer no HTML) E o GLB estar pronto
// antes de registrar — caso contrário keyMeshes estaria vazio.
function setupScrollAnimations() {
  if (!window.gsap || !window.ScrollTrigger || !modelLoaded) {
    requestAnimationFrame(setupScrollAnimations);
    return;
  }

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  // Fade de entrada
  gsap.to(pose, { opacity: 1, duration: 1.8, ease: 'power2.out' });

  // Configuração padrão para as transições entre seções
  const trigger = (id, scrub = 1.5) => ({
    trigger:        id,
    start:          'top bottom',  // inicia quando o topo da seção entra pelo rodapé
    end:            'top top',     // termina quando o topo da seção chega no topo
    scrub,
  });

  // ─── Hero → About ─────────────────────────────────────────────────────────
  // Zoom in durante a desmontagem: teclado cresce enquanto as teclas voam,
  // dando sensação de câmera se aproximando antes de tudo desaparecer.
  gsap.fromTo(pose,
    { rotY: rad(48),  rotX: rad(64),  posX: 0,   posY: 0,    posZ: 0,    scale: 1.00, opacity: 1 },
    { rotY: rad(42),  rotX: rad(58),  posX: 0,   posY: -0.2, posZ: 0,    scale: 1.55, opacity: 0,
      ease: 'power1.inOut',
      immediateRender: false,
      scrollTrigger: { ...trigger('#about', 1.2) },
    }
  );

  // ─── Desmontagem das keycaps ──────────────────────────────────────────────
  // Cada tecla flutua para cima com offset aleatório, gira em ângulos próprios,
  // e desaparece — stagger aleatório para criar a sensação de desencaixe
  // orgânico em vez de "uma por uma".
  if (keyMeshes.length > 0) {
    const keysTl = gsap.timeline({
      scrollTrigger: {
        trigger: '#about',
        start:   'top bottom',
        end:     'top 30%',     // termina cedo — antes do pose acabar de sumir
        scrub:   1.2,
      },
    });

    keysTl.to(keyMeshes.map((k) => k.position), {
      x: (i) => keyMeshes[i].userData.initialPos.x + keyMeshes[i].userData.driftX,
      y: (i) => keyMeshes[i].userData.initialPos.y + keyMeshes[i].userData.lift,
      z: (i) => keyMeshes[i].userData.initialPos.z + keyMeshes[i].userData.driftZ,
      ease:    'power2.in',
      stagger: { amount: 0.6, from: 'random' },
    }, 0);

    keysTl.to(keyMeshes.map((k) => k.rotation), {
      x: (i) => keyMeshes[i].userData.initialRot.x + keyMeshes[i].userData.tiltX,
      y: (i) => keyMeshes[i].userData.initialRot.y + keyMeshes[i].userData.tiltY,
      z: (i) => keyMeshes[i].userData.initialRot.z + keyMeshes[i].userData.tiltZ,
      ease:    'power1.in',
      stagger: { amount: 0.6, from: 'random' },
    }, 0);

    // Fade individual de cada tecla — começa um pouco depois do lift para
    // a tecla ser vista subindo antes de desaparecer
    const materials = keyMeshes
      .map((k) => k.material)
      .flatMap((m) => (Array.isArray(m) ? m : [m]))
      .filter(Boolean);

    keysTl.to(materials, {
      opacity: 0,
      ease:    'power2.in',
      stagger: { amount: 0.6, from: 'random' },
    }, 0.2);
  }

  // ─── About → Box ──────────────────────────────────────────────────────────
  // Teclado já está desmontado/invisível — segue invisível, sem custo visual.
  // (mantido como noop intencional para clareza do mapa de transições)

  // ─── Box → Skills ─────────────────────────────────────────────────────────
  // Antes de reaparecer, reseta as keycaps para a posição original (instantâneo,
  // fora da viewport — o usuário não vê) e o teclado entra inteiro pela esquerda.
  ScrollTrigger.create({
    trigger: '#skills',
    start:   'top bottom',
    onEnter: () => resetKeycaps(),
    onEnterBack: () => {}, // ao voltar do skills para box, não toca nas teclas
  });

  gsap.fromTo(pose,
    { rotY: rad(-30), rotX: rad(48), posX: -2.5, posY: 0.3,  posZ: -0.8, scale: 0.82, opacity: 0 },
    { rotY: rad(-30), rotX: rad(48), posX: -1.6, posY: 0.3,  posZ: -0.8, scale: 0.82, opacity: 1,
      immediateRender: false,
      scrollTrigger: trigger('#skills', 1),
    }
  );

  // ─── Skills → Projects ────────────────────────────────────────────────────
  // Teclado centraliza em perspectiva mais baixa
  gsap.fromTo(pose,
    { rotY: rad(-30), rotX: rad(48), posX: -1.6, posY: 0.3,  posZ: -0.8, scale: 0.82, opacity: 1 },
    { rotY: rad(5),   rotX: rad(40), posX: 0.6,  posY: -0.6, posZ: -1.0, scale: 0.78, opacity: 1,
      immediateRender: false,
      scrollTrigger: trigger('#projects'),
    }
  );

  // ─── Projects → Services ──────────────────────────────────────────────────
  // Teclado recua e desvanece — não distrai nas seções finais
  gsap.fromTo(pose,
    { rotY: rad(5),  rotX: rad(40), posX: 0.6, posY: -0.6, posZ: -1.0, scale: 0.78, opacity: 1 },
    { rotY: rad(5),  rotX: rad(40), posX: 0.6, posY: -0.6, posZ: -3.0, scale: 0.70, opacity: 0,
      immediateRender: false,
      scrollTrigger: trigger('#services', 1),
    }
  );
}

// ─── Reset das keycaps — usado quando o teclado reaparece após o "Sobre mim" ─
function resetKeycaps() {
  if (keyMeshes.length === 0) return;
  keyMeshes.forEach((k) => {
    k.position.copy(k.userData.initialPos);
    k.rotation.copy(k.userData.initialRot);
    const mats = Array.isArray(k.material) ? k.material : [k.material];
    mats.forEach((m) => { if (m) m.opacity = 1; });
  });
}

setupScrollAnimations();

// ─── Resize ───────────────────────────────────────────────────────────────────
new ResizeObserver(resize).observe(container);
