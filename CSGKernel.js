/**
 * CSGKernel — BSP CSG for three.js (ES module entry)
 *
 * Creators (see CREDITS.md · NOTICE · LICENSE):
 *   - BSP algorithm: Evan Wallace — csg.js (MIT, © 2011) https://github.com/evanw/csg.js
 *   - three.js peer: mrdoob & contributors (MIT) https://threejs.org/
 *   - Brush/Evaluator naming inspired by three-bvh-csg — gkjohnson (MIT)
 *   - Package, bridge, prefabs, kit: BHTANK (MIT, © 2026)
 */
export {
  ADDITION, SUBTRACTION, REVERSE_SUBTRACTION, INTERSECTION, DIFFERENCE, OPS,
  setEpsilon, getEpsilon, CSG
} from './src/csg.js';
export { Brush, Evaluator } from './src/brush.js';
export { wallWithOpenings, doorFrame, wallWithDoor } from './src/prefabs.js';
export { CSG as default } from './src/csg.js';
