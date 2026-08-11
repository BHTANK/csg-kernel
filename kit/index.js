/**
 * kit/ — assembly utilities combining csg-kernel with three.js workflows.
 *
 * Creators / credits (see CREDITS.md · NOTICE):
 *   - BSP CSG algorithm: Evan Wallace — csg.js (MIT, © 2011)
 *   - three.js peer: mrdoob & contributors (MIT)
 *   - Brush/Evaluator naming inspired by three-bvh-csg — gkjohnson (MIT)
 *   - Kit helpers & packaging: BHTANK (MIT, © 2026)
 *   - helpers-catalog paths: three.js examples/jsm (mrdoob et al., MIT) — index only
 */

export { assemble, solidFromObject, placeBoxCutter, OP_MAP } from './assembly.js';
export { mergeMeshes, centerGeometry, ensureNormals, disposeObject } from './mesh-utils.js';
export { createDemoScene } from './scene-boot.js';
export { default as helpersCatalog } from './helpers-catalog.js';

import helpersCatalog from './helpers-catalog.js';

export function listJsmCategories() {
  return Object.keys(helpersCatalog.jsm || {});
}

export function listJsmModules(category) {
  return (helpersCatalog.jsm && helpersCatalog.jsm[category]) || [];
}

export function listExampleCategories() {
  return Object.keys(helpersCatalog.examples || {});
}
