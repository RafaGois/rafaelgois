/**
 * Carrega os módulos Three.js da dobra #box quando a seção está a ~1 viewport
 * de distância. Painéis são `hidden md:block` — não carrega em mobile.
 */
const CACHE_VERSION = '2';

const BOX_3D_MODULES = [
  `./box-right-3d.js?v=${CACHE_VERSION}`,
  `./box-left-bottom-3d.js?v=${CACHE_VERSION}`,
  `./box-right-mouse.js?v=${CACHE_VERSION}`,
  `./box-right-bottom-3d.js?v=${CACHE_VERSION}`,
  `./box-right-top-3d.js?v=${CACHE_VERSION}`,
  `./box-left-top-3d.js?v=${CACHE_VERSION}`,
];

const MD_MIN_WIDTH = '(min-width: 768px)';

function isBox3dViewport() {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia(MD_MIN_WIDTH).matches
  );
}

let loadStarted = false;
let observerStarted = false;
/** @type {IntersectionObserver | null} */
let boxObserver = null;

function loadBox3dModules() {
  if (loadStarted || !isBox3dViewport()) return;
  loadStarted = true;
  boxObserver?.disconnect();
  boxObserver = null;

  Promise.all(BOX_3D_MODULES.map((href) => import(href))).catch((err) => {
    console.error('[box-3d-loader] Falha ao carregar módulos 3D da dobra #box:', err);
    loadStarted = false;
  });
}

/** ~1 viewport acima/abaixo para começar o download antes da dobra entrar na tela. */
function oneViewportRootMargin() {
  const px = `${Math.max(window.innerHeight, 1)}px`;
  return `${px} 0px ${px} 0px`;
}

function startBox3dLazyLoad() {
  if (!isBox3dViewport() || loadStarted || observerStarted) return;

  const section = document.getElementById('box');
  if (!section) return;

  observerStarted = true;

  if (!('IntersectionObserver' in window)) {
    loadBox3dModules();
    return;
  }

  boxObserver = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      loadBox3dModules();
    },
    { root: null, rootMargin: oneViewportRootMargin(), threshold: 0 },
  );

  boxObserver.observe(section);
}

startBox3dLazyLoad();

if (typeof window.matchMedia === 'function') {
  window.matchMedia(MD_MIN_WIDTH).addEventListener('change', (event) => {
    if (event.matches) startBox3dLazyLoad();
  });
}
