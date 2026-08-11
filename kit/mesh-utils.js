/**
 * kit/mesh-utils.js — lightweight mesh helpers for assembly pipelines.
 *
 * Depends on three.js peer (© mrdoob & contributors, MIT).
 * Utility code © BHTANK (MIT). Credits: CREDITS.md
 */

import * as THREE from 'three';

/** Merge an array of meshes into one BufferGeometry (world-space). */
export function mergeMeshes(meshes, { useGroups = true } = {}) {
  const geos = [];
  let matIndex = 0;
  const materials = [];
  for (const mesh of meshes) {
    mesh.updateWorldMatrix(true, false);
    const g = mesh.geometry.index
      ? mesh.geometry.toNonIndexed()
      : mesh.geometry.clone();
    g.applyMatrix4(mesh.matrixWorld);
    if (useGroups) {
      const count = g.attributes.position.count;
      g.clearGroups();
      g.addGroup(0, count, matIndex);
      materials.push(mesh.material);
      matIndex++;
    }
    geos.push(g);
  }
  // Manual concat (no BufferGeometryUtils dependency)
  let triVerts = 0;
  for (const g of geos) triVerts += g.attributes.position.count;
  const pos = new Float32Array(triVerts * 3);
  const nrm = new Float32Array(triVerts * 3);
  const uvs = new Float32Array(triVerts * 2);
  let pi = 0, ni = 0, ui = 0, vBase = 0;
  const groups = [];
  for (let gi = 0; gi < geos.length; gi++) {
    const g = geos[gi];
    const p = g.attributes.position;
    const n = g.attributes.normal || (g.computeVertexNormals(), g.attributes.normal);
    const u = g.attributes.uv;
    const start = vBase;
    for (let i = 0; i < p.count; i++) {
      pos[pi++] = p.getX(i); pos[pi++] = p.getY(i); pos[pi++] = p.getZ(i);
      nrm[ni++] = n.getX(i); nrm[ni++] = n.getY(i); nrm[ni++] = n.getZ(i);
      if (u) { uvs[ui++] = u.getX(i); uvs[ui++] = u.getY(i); }
      else { uvs[ui++] = 0; uvs[ui++] = 0; }
    }
    groups.push({ start, count: p.count, materialIndex: gi });
    vBase += p.count;
    g.dispose?.();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  if (useGroups) for (const g of groups) out.addGroup(g.start, g.count, g.materialIndex);
  out.computeBoundingBox();
  out.computeBoundingSphere();
  return { geometry: out, materials: useGroups ? materials : materials[0] };
}

export function centerGeometry(geometry) {
  geometry.computeBoundingBox();
  const c = new THREE.Vector3();
  geometry.boundingBox.getCenter(c);
  geometry.translate(-c.x, -c.y, -c.z);
  return c;
}

export function ensureNormals(geometry) {
  if (!geometry.attributes.normal) geometry.computeVertexNormals();
  return geometry;
}

/** Dispose geometry + material(s) on a mesh or group of meshes. */
export function disposeObject(root) {
  root.traverse((o) => {
    if (o.geometry) o.geometry.dispose?.();
    if (o.material) {
      if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose?.());
      else o.material.dispose?.();
    }
  });
}
