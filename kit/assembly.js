/**
 * kit/assembly.js — compose multi-step CSG + mesh transforms.
 *
 * CSG ops: algorithm © Evan Wallace (csg.js, MIT 2011)
 * three.js types: peer © mrdoob & contributors (MIT)
 * Assembly helpers: © BHTANK (MIT)
 * Credits: CREDITS.md
 */

import * as THREE from 'three';
import {
  CSG,
  ADDITION,
  SUBTRACTION,
  INTERSECTION,
  DIFFERENCE,
  REVERSE_SUBTRACTION
} from '../CSGKernel.js';

const OP_MAP = {
  union: ADDITION,
  add: ADDITION,
  addition: ADDITION,
  subtract: SUBTRACTION,
  sub: SUBTRACTION,
  subtraction: SUBTRACTION,
  reverse: REVERSE_SUBTRACTION,
  reverse_subtraction: REVERSE_SUBTRACTION,
  intersect: INTERSECTION,
  intersection: INTERSECTION,
  difference: DIFFERENCE,
  xor: DIFFERENCE
};

/**
 * Run a list of boolean steps.
 * @param {object} root - Mesh | BufferGeometry | CSG
 * @param {Array<{ op: string, with: object, material?: * }>} steps
 * @param {object} [opts]
 * @returns {import('../CSGKernel.js').CSG|THREE.Mesh|THREE.BufferGeometry}
 */
export function assemble(root, steps = [], opts = {}) {
  let acc = CSG._toCSG ? CSG._toCSG(root, null, opts) : null;
  // Prefer public path if _toCSG is not exported in types
  if (!acc) {
    if (root.isMesh) acc = CSG.fromMesh(root, opts);
    else if (root.isBufferGeometry) acc = CSG.fromGeometry(root, opts.matrixA || null, opts);
    else acc = root;
  }
  for (const step of steps) {
    const opKey = String(step.op || 'subtract').toLowerCase();
    const op = OP_MAP[opKey] || SUBTRACTION;
    const other = step.with;
    const B = other.isMesh
      ? CSG.fromMesh(other, opts)
      : other.isBufferGeometry
        ? CSG.fromGeometry(other, step.matrix || null, opts)
        : other;
    switch (op) {
      case ADDITION: acc = acc.union(B); break;
      case SUBTRACTION: acc = acc.subtract(B); break;
      case REVERSE_SUBTRACTION: acc = acc.reverseSubtract(B); break;
      case INTERSECTION: acc = acc.intersect(B); break;
      case DIFFERENCE: acc = acc.difference(B); break;
      default: throw new Error('assemble: unknown op ' + step.op);
    }
  }
  if (opts.asCSG) return acc;
  if (opts.asGeometry) return acc.toGeometry(opts);
  return acc.toMesh(opts.material, opts);
}

/**
 * Apply a THREE.Matrix4 (or object transform) then return CSG solid.
 */
export function solidFromObject(object3d, opts = {}) {
  object3d.updateWorldMatrix(true, false);
  if (object3d.isMesh) return CSG.fromMesh(object3d, opts);
  // Flatten first mesh child
  let found = null;
  object3d.traverse((o) => {
    if (!found && o.isMesh) found = o;
  });
  if (!found) throw new Error('solidFromObject: no Mesh in hierarchy');
  found.updateWorldMatrix(true, false);
  return CSG.fromMesh(found, opts);
}

/**
 * Place a cutter in world space relative to a host mesh (for door/window recipes).
 */
export function placeBoxCutter({
  center = [0, 0, 0],
  size = [1, 1, 1],
  materialIndex = 0
} = {}) {
  const hx = size[0] * 0.5, hy = size[1] * 0.5, hz = size[2] * 0.5;
  return CSG.cube({
    center,
    radius: [hx, hy, hz],
    materialIndex
  });
}

export { OP_MAP };
