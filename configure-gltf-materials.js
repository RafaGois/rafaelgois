/**
 * Alinha GLB carregados ao mesmo pipeline visual do painel direito
 * (box-right-mouse.js): colorSpace das texturas + correção de alpha/draw.
 */
import * as THREE from 'three';

export function configureGltfSceneMaterials(root) {
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.castShadow = obj.receiveShadow = true;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const m of mats) {
      if (!m) continue;
      if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
      if (m.emissiveMap) m.emissiveMap.colorSpace = THREE.SRGBColorSpace;
      if (m.normalMap) m.normalMap.colorSpace = THREE.LinearSRGBColorSpace;
      if (m.roughnessMap) m.roughnessMap.colorSpace = THREE.LinearSRGBColorSpace;
      if (m.metalnessMap) m.metalnessMap.colorSpace = THREE.LinearSRGBColorSpace;
      if (m.aoMap) m.aoMap.colorSpace = THREE.LinearSRGBColorSpace;
      if (m.clearcoatNormalMap) m.clearcoatNormalMap.colorSpace = THREE.LinearSRGBColorSpace;
      m.alphaTest = 0;
      m.transparent = false;
      m.depthWrite = true;
      m.side = THREE.DoubleSide;
      m.needsUpdate = true;
    }
  });
}
