/**
 * CSGKernel.mono.js — single import path (re-exports modular build).
 *
 * Creators (see CREDITS.md · NOTICE · LICENSE):
 *   - BSP algorithm: Evan Wallace — csg.js (MIT, © 2011)
 *   - three.js peer: mrdoob & contributors (MIT)
 *   - Brush/Evaluator naming inspired by three-bvh-csg — gkjohnson (MIT)
 *   - Package: BHTANK (MIT, © 2026)
 */
export {
  CSG,
  ADDITION,
  SUBTRACTION,
  REVERSE_SUBTRACTION,
  INTERSECTION,
  DIFFERENCE,
  OPS,
  setEpsilon,
  getEpsilon,
  Brush,
  Evaluator,
  wallWithOpenings,
  doorFrame,
  wallWithDoor
} from './CSGKernel.js';
export { default } from './CSGKernel.js';
