/**
 * src/csg.js — public re-export
 * Algorithm: Evan Wallace csg.js (MIT). Peer three.js: mrdoob (MIT). Package: BHTANK.
 * Credits: CREDITS.md
 */
export {
  CSG, ADDITION, SUBTRACTION, REVERSE_SUBTRACTION, INTERSECTION, DIFFERENCE, OPS,
  setEpsilon, getEpsilon, EPS
} from './csg-bridge.js';
export { CSG as default } from './csg-bridge.js';
