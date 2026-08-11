/**
 * CSGKernel mono entry (ESM re-export of modular package).
 * Full inlined mono (27971 chars) is staged at /tmp/csg_push_batches/MONO_FINAL.txt for follow-up upload.
 * Algorithm © Evan Wallace (csg.js MIT); three.js peer © mrdoob; package © BHTANK.
 */
export {
  ADDITION, SUBTRACTION, REVERSE_SUBTRACTION, INTERSECTION, DIFFERENCE, OPS,
  setEpsilon, getEpsilon, CSG, Brush, Evaluator,
  wallWithOpenings, doorFrame, wallWithDoor
} from './CSGKernel.js';
export { CSG as default } from './CSGKernel.js';
