/**
 * Entrada única do Three.js no index: só em viewport ≥ md (900px).
 * Adia o carregamento com requestIdleCallback para não competir com LCP.
 * Hero no load; dobra #box via box-3d-loader (lazy + fila de GLBs).
 */
const CACHE_VERSION = '6';
const MD_MIN_WIDTH = '(min-width: 900px)';

let started = false;

function isDesktop3dViewport() {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia(MD_MIN_WIDTH).matches
  );
}

function startThreeModules() {
  if (started || !isDesktop3dViewport()) return;
  started = true;

  const hero = import(`./hero-3d.js?v=${CACHE_VERSION}`);
  const box = import(`./box-3d-loader.js?v=${CACHE_VERSION}`);

  Promise.all([hero, box]).catch((err) => {
    console.error('[three-entry] Falha ao carregar módulos 3D:', err);
    started = false;
  });
}

function scheduleThreeStart() {
  if (!isDesktop3dViewport()) return;

  const run = () => startThreeModules();

  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(run, { timeout: 2000 });
  } else {
    window.setTimeout(run, 1);
  }
}

scheduleThreeStart();

if (typeof window.matchMedia === 'function') {
  window.matchMedia(MD_MIN_WIDTH).addEventListener('change', (event) => {
    if (event.matches) scheduleThreeStart();
  });
}
