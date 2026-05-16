import * as THREE from 'three';

/**
 * Normaliza escala ao `targetSize` e centraliza a malha pela bbox pós-escala.
 * Ordem obrigatória: escala → bbox → `-center` em position.
 */
export function fitModel(model, targetSize) {
  const box0 = new THREE.Box3().setFromObject(model);
  const size = box0.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  if (!maxDim || !isFinite(maxDim)) return;

  model.scale.setScalar(targetSize / maxDim);

  const box1 = new THREE.Box3().setFromObject(model);
  const ctr = box1.getCenter(new THREE.Vector3());
  model.position.set(-ctr.x, -ctr.y, -ctr.z);
}
