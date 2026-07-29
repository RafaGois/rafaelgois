/**
 * Fila global de GLBs: teclado (hero) primeiro; dobra #box depois, até 2 em paralelo.
 */
import { getGltfLoader } from './three-bootstrap.js';

const BOX_CONCURRENCY = 2;

/** @type {{ url: string, onLoad: (gltf: object) => void, onError?: (err: unknown) => void }[]} */
const heroQueue = [];
/** @type {{ url: string, onLoad: (gltf: object) => void, onError?: (err: unknown) => void }[]} */
const boxQueue = [];

let heroInFlight = 0;
let boxInFlight = 0;

function runJob(job, lane) {
  getGltfLoader().load(
    job.url,
    (gltf) => {
      if (lane === 'hero') heroInFlight = 0;
      else boxInFlight -= 1;
      try {
        job.onLoad(gltf);
      } finally {
        pumpQueue();
      }
    },
    undefined,
    (err) => {
      if (lane === 'hero') heroInFlight = 0;
      else boxInFlight -= 1;
      if (job.onError) job.onError(err);
      else console.error(`[gltf-load-queue] ${lane}:`, job.url, err);
      pumpQueue();
    },
  );
}

function pumpQueue() {
  if (heroInFlight === 0 && heroQueue.length > 0) {
    heroInFlight = 1;
    runJob(heroQueue.shift(), 'hero');
    return;
  }

  if (heroInFlight > 0) return;

  while (boxInFlight < BOX_CONCURRENCY && boxQueue.length > 0) {
    boxInFlight += 1;
    runJob(boxQueue.shift(), 'box');
  }
}

function enqueue(lane, url, onLoad, onError) {
  const job = { url, onLoad, onError };
  if (lane === 'hero') heroQueue.push(job);
  else boxQueue.push(job);
  pumpQueue();
}

/** Teclado e demais GLBs do hero — sempre antes da dobra #box. */
export function loadHeroGltf(url, onLoad, onError) {
  enqueue('hero', url, onLoad, onError);
}

/** Modelos da dobra #box — após o hero; no máximo 2 downloads simultâneos. */
export function loadBoxGltf(url, onLoad, onError) {
  enqueue('box', url, onLoad, onError);
}
