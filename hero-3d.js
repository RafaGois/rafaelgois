import * as THREE from 'three';
import { loadHeroGltf } from './gltf-load-queue.js';
import { registerRenderLayer } from './three-composite-renderer.js';
import {
  PointerSmoother,
  animationMixerMaybeUpdate,
  createOptionalAnimationMixer,
  motionIdleAmp,
  motionPointerAmp,
  createRenderVisibilityWatcher,
} from './three-motion-helpers.js';

const container = document.getElementById('hero-3d-container');

if (!container) throw new Error('[hero-3d] container not found');

const renderVisibility = createRenderVisibilityWatcher(container, {
  isActive: () => !container.classList.contains('hero-3d-suppressed'),
});

/**
 * Teclado fixo: some na dobra “Pensando fora da caixa” (#box) e daí em diante
 * (#projects…), mas permanece visível em Hero, Sobre e Habilidades (#skills).
 * Ordem no DOM: #about → #box → #skills → #projects — por isso não dá para
 * usar só #box como limite (em Habilidades o #box já está acima da tela).
 */
function syncHero3dSuppressed() {
  const box = document.querySelector('#box');
  const skills = document.querySelector('#skills');
  const projects = document.querySelector('#projects');
  if (!box || !skills || !projects) return;

  const vh = window.innerHeight;
  // Não usar só `top < vh`: com Projetos só “encostando” no rodapé (ex.: em 03 Outros)
  // o teclado sumia. Alinhar ao início da animação de Projetos (`top 52%` no ScrollTrigger).
  const projectsEntered = projects.getBoundingClientRect().top < vh * 0.52;
  const skillsEntered = skills.getBoundingClientRect().top < vh;
  const boxEntered = box.getBoundingClientRect().top < vh;
  const inBoxFoldOnly = boxEntered && !skillsEntered;

  const suppressed = projectsEntered || inBoxFoldOnly;
  container.classList.toggle('hero-3d-suppressed', suppressed);
}

// ─── Scene ────────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();

// ─── Camera ───────────────────────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
camera.position.set(0, 1.2, 6.0);
camera.lookAt(0, 0, 0);

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

// Pose inicial: teclado horizontal, visto de cima e levemente à frente-esquerda
const BASE_ROT_Y = rad(38);
const BASE_ROT_X = rad(22);

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
/** @type {THREE.AnimationMixer | null} */
let gltfMixer = null;

loadHeroGltf(
  './keyboard.glb',
  (gltf) => {
    const model  = gltf.scene;
    const box    = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size   = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    model.position.sub(center);
    model.scale.setScalar(3.2 / maxDim);
    model.rotation.z = rad(-5);

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
    gltfMixer = createOptionalAnimationMixer(model, gltf.animations);
    modelLoaded = true;
  },
  undefined,
  (err) => console.error('[hero-3d] Failed to load keyboard.glb:', err)
);

// ─── Input — mouse parallax (delta-based; ≈ ex-0.03/frame @60 Hz → rate = -ln(0.97)·60) ─
let targetMouseX = 0;
let targetMouseY = 0;
const heroPointerSmoothRatePerSec = -Math.log(0.97) * 60;
const pointerSmoother = new PointerSmoother(heroPointerSmoothRatePerSec);

document.addEventListener('mousemove', (e) => {
  targetMouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
  targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});

registerRenderLayer({
  id: 'hero',
  scene,
  camera,
  getContainer: () => container,
  isInView: () => renderVisibility.isInView(),
  getOpacity: () => pose.opacity,
  zIndex: 0,
  toneMappingExposure: 1.0,
  update(dt, t) {
    animationMixerMaybeUpdate(gltfMixer, dt);
    pointerSmoother.update(targetMouseX, targetMouseY, dt);

    const idleA = motionIdleAmp();
    const ptrA  = motionPointerAmp();
    const mouseX = pointerSmoother.x * ptrA;
    const mouseY = pointerSmoother.y * ptrA;
    const p = pose.scale;

    modelGroup.rotation.y = pose.rotY
      + Math.sin(t * 0.28) * 0.025 * idleA
      + mouseX * 0.06 * p;

    modelGroup.rotation.x = pose.rotX
      + Math.sin(t * 0.19) * 0.015 * idleA
      + mouseY * 0.04 * p;

    modelGroup.position.set(
      pose.posX,
      pose.posY + Math.sin(t * 0.6) * 0.09 * idleA,
      pose.posZ,
    );

    modelGroup.scale.setScalar(pose.scale);
  },
});

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
    { rotY: rad(38),  rotX: rad(22),  posX: 0,   posY: 0,    posZ: 0,    scale: 1.00, opacity: 1 },
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
  // Teclado entra vindo da direita enquanto as teclas se remontam com scrub.
  // NÃO fazemos resetKeycaps() no enter — as teclas chegam já dispersas e
  // a própria timeline as recoloca nas posições originais conforme o scroll.
  gsap.fromTo(pose,
    { rotY: rad(-30), rotX: rad(22), posX: 2.5,  posY: 0.3,  posZ: -0.8, scale: 0.52, opacity: 0 },
    { rotY: rad(-30), rotX: rad(22), posX: 1.6,  posY: 0.3,  posZ: -0.8, scale: 0.58, opacity: 1,
      immediateRender: false,
      scrollTrigger: {
        trigger: '#skills',
        start:   'top center',
        end:     'top top',
        scrub:   1,
      },
    }
  );

  // ─── Remontagem das keycaps em Skills ──────────────────────────────────────
  // Ao entrar em Skills: coloca as teclas no estado espalhado via gsap.set()
  // e dispara uma animação livre (sem scrub) que as remonta.
  // Sem fromTo → sem conflito com a desmontagem do Hero.
  if (keyMeshes.length > 0) {
    const assemblyMats = keyMeshes
      .map((k) => k.material)
      .flatMap((m) => (Array.isArray(m) ? m : [m]))
      .filter(Boolean);

    let assemblyPlayed = false;

    ScrollTrigger.create({
      trigger: '#skills',
      start:   'top center',
      onEnter() {
        // Posiciona as teclas no estado espalhado (silenciosamente)
        keyMeshes.forEach((k) => {
          gsap.set(k.position, {
            x: k.userData.initialPos.x + k.userData.driftX,
            y: k.userData.initialPos.y + k.userData.lift,
            z: k.userData.initialPos.z + k.userData.driftZ,
          });
          gsap.set(k.rotation, {
            x: k.userData.initialRot.x + k.userData.tiltX,
            y: k.userData.initialRot.y + k.userData.tiltY,
            z: k.userData.initialRot.z + k.userData.tiltZ,
          });
        });
        assemblyMats.forEach((m) => { if (m) m.opacity = 0; });

        // Remonta com stagger aleatório
        const tl = gsap.timeline();
        tl.to(keyMeshes.map((k) => k.position), {
          x: (i) => keyMeshes[i].userData.initialPos.x,
          y: (i) => keyMeshes[i].userData.initialPos.y,
          z: (i) => keyMeshes[i].userData.initialPos.z,
          duration: 1.6,
          ease:     'power3.out',
          stagger:  { amount: 0.7, from: 'random' },
        }, 0);
        tl.to(keyMeshes.map((k) => k.rotation), {
          x: (i) => keyMeshes[i].userData.initialRot.x,
          y: (i) => keyMeshes[i].userData.initialRot.y,
          z: (i) => keyMeshes[i].userData.initialRot.z,
          duration: 1.6,
          ease:     'power2.out',
          stagger:  { amount: 0.7, from: 'random' },
        }, 0);
        tl.to(assemblyMats, {
          opacity:  1,
          duration: 1.2,
          ease:     'power1.out',
          stagger:  { amount: 0.7, from: 'random' },
        }, 0);
      },
      onLeave() {
        // ao sair de skills para baixo, reseta para quando voltar
        resetKeycaps();
      },
      onEnterBack() {
        // ao voltar de projetos, remonta de novo
        keyMeshes.forEach((k) => {
          gsap.set(k.position, {
            x: k.userData.initialPos.x + k.userData.driftX,
            y: k.userData.initialPos.y + k.userData.lift,
            z: k.userData.initialPos.z + k.userData.driftZ,
          });
          gsap.set(k.rotation, {
            x: k.userData.initialRot.x + k.userData.tiltX,
            y: k.userData.initialRot.y + k.userData.tiltY,
            z: k.userData.initialRot.z + k.userData.tiltZ,
          });
        });
        assemblyMats.forEach((m) => { if (m) m.opacity = 0; });
        const tl = gsap.timeline();
        tl.to(keyMeshes.map((k) => k.position), {
          x: (i) => keyMeshes[i].userData.initialPos.x,
          y: (i) => keyMeshes[i].userData.initialPos.y,
          z: (i) => keyMeshes[i].userData.initialPos.z,
          duration: 1.4, ease: 'power3.out',
          stagger: { amount: 0.6, from: 'random' },
        }, 0);
        tl.to(keyMeshes.map((k) => k.rotation), {
          x: (i) => keyMeshes[i].userData.initialRot.x,
          y: (i) => keyMeshes[i].userData.initialRot.y,
          z: (i) => keyMeshes[i].userData.initialRot.z,
          duration: 1.4, ease: 'power2.out',
          stagger: { amount: 0.6, from: 'random' },
        }, 0);
        tl.to(assemblyMats, {
          opacity: 1, duration: 1.0, ease: 'power1.out',
          stagger: { amount: 0.6, from: 'random' },
        }, 0);
      },
    });
  }

  // ─── Skills parte 1 → parte 2 (Backend) ──────────────────────────────────
  // Desliza para a esquerda girando no Y (mostra lateral) e inclinando para frente.
  gsap.fromTo(pose,
    { rotY: rad(-30), rotX: rad(22), posX: 1.6,   posY: 0.3,  posZ: -0.8,  scale: 0.58, opacity: 1 },
    { rotY: rad(55),  rotX: rad(10), posX: -1.35, posY: 0.55, posZ: -0.3,  scale: 0.64, opacity: 1,
      ease: 'power2.inOut',
      immediateRender: false,
      scrollTrigger: {
        trigger: '#skills-backend',
        start:   'top 90%',
        end:     'top 52%',
        scrub:   1.2,
      },
    }
  );

  // ─── Skills parte 2 → parte 3 (Outros) ───────────────────────────────────
  // Da pose lateral vira para overhead e desliza para a direita — como
  // uma peça que flutua de um lado para o outro passando por cima da cena.
  gsap.fromTo(pose,
    { rotY: rad(55),  rotX: rad(10), posX: -1.35, posY: 0.55, posZ: -0.3,  scale: 0.64, opacity: 1 },
    { rotY: rad(-22), rotX: rad(52), posX: 1.85,  posY: 0.3,  posZ: -0.75, scale: 0.58, opacity: 1,
      ease: 'power1.inOut',
      immediateRender: false,
      scrollTrigger: {
        trigger: '#skills-outros',
        start:   'top 88%',
        end:     'top 38%',
        scrub:   1.1,
      },
    }
  );

  // ─── Skills → Projects — desmontagem ─────────────────────────────────────
  // Mesma lógica do Hero: teclas voam com stagger aleatório enquanto o canvas
  // some (pose com zoom leve). Ao voltar de Projetos para Skills, a timeline
  // de remontagem acima (scrub reverso) recoloca as teclas — sem resetKeycaps().
  gsap.fromTo(pose,
    { rotY: rad(-22), rotX: rad(52), posX: 1.85,  posY: 0.3,  posZ: -0.75, scale: 0.58, opacity: 1 },
    { rotY: rad(-18), rotX: rad(56), posX: 1.85,  posY: 0.1,  posZ: -0.75, scale: 0.72, opacity: 0,
      ease: 'power1.inOut',
      immediateRender: false,
      scrollTrigger: {
        trigger: '#projects',
        start:   'top 52%',
        end:     'top 8%',
        scrub:   1.35,
      },
    }
  );

  if (keyMeshes.length > 0) {
    const skillsTl = gsap.timeline({
      scrollTrigger: {
        trigger: '#projects',
        start:   'top 52%',
        end:     'top 20%',
        scrub:   1.2,
      },
    });

    skillsTl.to(keyMeshes.map((k) => k.position), {
      x: (i) => keyMeshes[i].userData.initialPos.x + keyMeshes[i].userData.driftX,
      y: (i) => keyMeshes[i].userData.initialPos.y + keyMeshes[i].userData.lift,
      z: (i) => keyMeshes[i].userData.initialPos.z + keyMeshes[i].userData.driftZ,
      ease:    'power2.in',
      stagger: { amount: 0.55, from: 'random' },
    }, 0);

    skillsTl.to(keyMeshes.map((k) => k.rotation), {
      x: (i) => keyMeshes[i].userData.initialRot.x + keyMeshes[i].userData.tiltX,
      y: (i) => keyMeshes[i].userData.initialRot.y + keyMeshes[i].userData.tiltY,
      z: (i) => keyMeshes[i].userData.initialRot.z + keyMeshes[i].userData.tiltZ,
      ease:    'power1.in',
      stagger: { amount: 0.55, from: 'random' },
    }, 0);

    const skillsMats = keyMeshes
      .map((k) => k.material)
      .flatMap((m) => (Array.isArray(m) ? m : [m]))
      .filter(Boolean);

    skillsTl.to(skillsMats, {
      opacity: 0,
      ease:    'power2.in',
      stagger: { amount: 0.55, from: 'random' },
    }, 0.18);
  }

  if (!container.dataset.hero3dSuppressBound) {
    container.dataset.hero3dSuppressBound = '1';
    ScrollTrigger.addEventListener('refresh', syncHero3dSuppressed);
    window.addEventListener('scroll', syncHero3dSuppressed, { passive: true });
  }
  syncHero3dSuppressed();
  ScrollTrigger.refresh();
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
