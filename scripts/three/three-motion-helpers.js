/**
 * Procedural Three.js helpers — smoothing com delta explícito (frame-rate estável).
 * Ver .cursor/skills/SKILL.md (procedural animation + uso de Clock.getDelta).
 */
import * as THREE from 'three';

/** ~Equivalente exponencial ao lerp `(s += (target - s) * 0.05)` em ~60 Hz quando rate ≈ 3.08. */
export const DEFAULT_EXP_SMOOTH_RATE_PER_SEC = 3.08;

/**
 * Taxa alpha para interpolação exponencial estável ao FPS:
 * erro(t+dt) = erro(t) * exp(-rate * dt).
 */
export function smoothExpTowardAlpha(ratePerSecond, delta) {
  const d = Math.max(0, delta);
  if (d === 0) return 0;
  return 1 - Math.exp(-ratePerSecond * d);
}

export function smoothExpTowardScalar(current, target, ratePerSecond, delta) {
  const a = smoothExpTowardAlpha(ratePerSecond, delta);
  return current + (target - current) * a;
}

/**
 * Mantém valores suaves (ex.: [-1,1] parallax normalizado): atualiza `out` por referência ou retorna objeto.
 */
export function smoothExpTowardXY(sx, sy, tx, ty, ratePerSecond, delta, out = {}) {
  const a = smoothExpTowardAlpha(ratePerSecond, delta);
  out.x = sx + (tx - sx) * a;
  out.y = sy + (ty - sy) * a;
  return out;
}

/** Multiplicador de oscilações idle (sin/cos livres — zero com reduce motion). */
export function motionIdleAmp() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 1;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1;
}

/**
 * Sensibilidade ao parallax de pointer quando reduce-motion: bem baixo, não zero,
 * para a cena não ficar morta quando o usuário mover o cursor.
 */
export function motionPointerAmp() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 1;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.22 : 1;
}

/** Suavização 2D reutilizável (último smoothed sempre em `.x` / `.y`). */
export class PointerSmoother {
  constructor(ratePerSecond = DEFAULT_EXP_SMOOTH_RATE_PER_SEC) {
    this.ratePerSecond = ratePerSecond;
    this.x = 0;
    this.y = 0;
  }

  update(targetX, targetY, delta) {
    const a = smoothExpTowardAlpha(this.ratePerSecond, delta);
    this.x += (targetX - this.x) * a;
    this.y += (targetY - this.y) * a;
    return this;
  }
}

/**
 * Mixer opcional + update no loop quando o GLB trouxer clips embutidas.
 */
export function createOptionalAnimationMixer(root, animations) {
  if (!animations?.length) return null;
  const mixer = new THREE.AnimationMixer(root);
  mixer.clipAction(animations[0]).play();
  return mixer;
}

export function animationMixerMaybeUpdate(mixer, delta) {
  if (mixer) mixer.update(delta);
}

/**
 * IntersectionObserver no elemento do canvas/container — pausar WebGL fora da tela.
 * @param {Element} element
 * @param {{ isActive?: () => boolean }} [options] — ex.: hero suprimido por scroll
 */
export function createRenderVisibilityWatcher(element, options = {}) {
  const { isActive } = options;
  let intersecting = true;

  const isInView = () => {
    if (!intersecting) return false;
    if (isActive && !isActive()) return false;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return false;
    }
    return true;
  };

  if (
    typeof window === 'undefined' ||
    !element ||
    !('IntersectionObserver' in window)
  ) {
    return { isInView };
  }

  const observer = new IntersectionObserver(
    (entries) => {
      intersecting = entries.some((e) => e.isIntersecting);
    },
    { threshold: 0 },
  );
  observer.observe(element);

  return {
    isInView,
    disconnect: () => observer.disconnect(),
  };
}
