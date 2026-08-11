/**
 * src/csg-ops.js — solid CSG ops (no three.js dependency)
 *
 * BSP algorithm: Evan Wallace — csg.js (MIT, © 2011) https://github.com/evanw/csg.js
 * Packaging: BHTANK (MIT). Credits: CREDITS.md
 */
import {
  EPS, setEpsilon, getEpsilon,
  V3, Vertex, Plane, Polygon, Node, sharedIndex
} from './bsp.js';

export { setEpsilon, getEpsilon, EPS };

export const ADDITION = 'addition';
export const SUBTRACTION = 'subtraction';
export const REVERSE_SUBTRACTION = 'reverse_subtraction';
export const INTERSECTION = 'intersection';
export const DIFFERENCE = 'difference';

export const OPS = Object.freeze({
  ADDITION, SUBTRACTION, REVERSE_SUBTRACTION, INTERSECTION, DIFFERENCE
});

export class CSG {
  constructor() {
    this.polygons = [];
  }

  static fromPolygons(polygons) {
    const c = new CSG();
    c.polygons = polygons;
    return c;
  }

  clone() {
    const c = new CSG();
    c.polygons = this.polygons.map(p => p.clone());
    return c;
  }

  toPolygons() { return this.polygons; }

  polygonCount() { return this.polygons.length; }

  triangleCount() {
    let n = 0;
    for (let i = 0; i < this.polygons.length; i++) {
      n += Math.max(0, this.polygons[i].vertices.length - 2);
    }
    return n;
  }

  /** A ∪ B */
  union(csg) {
    const a = new Node(this.clone().polygons);
    const b = new Node(csg.clone().polygons);
    a.clipTo(b);
    b.clipTo(a);
    b.invert();
    b.clipTo(a);
    b.invert();
    a.build(b.allPolygons());
    return CSG.fromPolygons(a.allPolygons());
  }

  /** A \ B */
  subtract(csg) {
    const a = new Node(this.clone().polygons);
    const b = new Node(csg.clone().polygons);
    a.invert();
    a.clipTo(b);
    b.clipTo(a);
    b.invert();
    b.clipTo(a);
    b.invert();
    a.build(b.allPolygons());
    a.invert();
    return CSG.fromPolygons(a.allPolygons());
  }

  /** B \ A */
  reverseSubtract(csg) {
    return csg.subtract(this);
  }

  /** A ∩ B */
  intersect(csg) {
    const a = new Node(this.clone().polygons);
    const b = new Node(csg.clone().polygons);
    a.invert();
    b.clipTo(a);
    b.invert();
    a.clipTo(b);
    b.clipTo(a);
    a.build(b.allPolygons());
    a.invert();
    return CSG.fromPolygons(a.allPolygons());
  }

  /** A ⊕ B = (A\B) ∪ (B\A) */
  difference(csg) {
    return this.subtract(csg).union(csg.subtract(this));
  }

  inverse() {
    const c = this.clone();
    for (let i = 0; i < c.polygons.length; i++) c.polygons[i].flip();
    return c;
  }
}
