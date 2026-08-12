/**
 * CSGKernel — a proper BSP Constructive Solid Geometry kernel for three.js
 *
 * Built for procedural three.js asset work (walls, doors, windows, prop kits)
 * where stacking meshes causes z-fighting / gaps and existing web CSG kernels
 * either lack BufferGeometry, drop world matrices, skip multi-material, or
 * leave non-manifold holes (see three-bvh-csg warnings; convex plane-brushes
 * alone cannot cut arbitrary openings).
 *
 * Ops: union · subtract · reverseSubtract · intersect · difference (XOR)
 * API: CSG.* helpers · Brush + Evaluator (three-bvh-csg style) · Prefab helpers
 *
 * Algorithm: Evan Wallace csg.js BSP (MIT), ES-module rewrite for BufferGeometry.
 * Bridge © BHTANK / Three.JS-Lab — MIT
 */

import * as THREE from 'three';

// ─── public op constants (familiar to three-bvh-csg users) ──────────────────
export const ADDITION = 'addition';
export const SUBTRACTION = 'subtraction';
export const REVERSE_SUBTRACTION = 'reverse_subtraction';
export const INTERSECTION = 'intersection';
export const DIFFERENCE = 'difference'; // symmetric difference A⊕B

export const OPS = Object.freeze({
  ADDITION,
  SUBTRACTION,
  REVERSE_SUBTRACTION,
  INTERSECTION,
  DIFFERENCE
});

// ─── epsilon (tunable) ──────────────────────────────────────────────────────
let EPS = 1e-5;
export function setEpsilon(v) { EPS = Math.max(1e-10, v); }
export function getEpsilon() { return EPS; }

// ─── Vector3 (kernel-local) ─────────────────────────────────────────────────
class V3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x; this.y = y; this.z = z;
  }
  clone() { return new V3(this.x, this.y, this.z); }
  negated() { return new V3(-this.x, -this.y, -this.z); }
  plus(a) { return new V3(this.x + a.x, this.y + a.y, this.z + a.z); }
  minus(a) { return new V3(this.x - a.x, this.y - a.y, this.z - a.z); }
  times(s) { return new V3(this.x * s, this.y * s, this.z * s); }
  dividedBy(s) { return new V3(this.x / s, this.y / s, this.z / s); }
  dot(a) { return this.x * a.x + this.y * a.y + this.z * a.z; }
  lerp(a, t) { return this.plus(a.minus(this).times(t)); }
  length() { return Math.sqrt(this.dot(this)); }
  unit() {
    const L = this.length();
    return L > 0 ? this.dividedBy(L) : new V3(0, 1, 0);
  }
  cross(a) {
    return new V3(
      this.y * a.z - this.z * a.y,
      this.z * a.x - this.x * a.z,
      this.x * a.y - this.y * a.x
    );
  }
}

// ─── Vertex ─────────────────────────────────────────────────────────────────
class Vertex {
  constructor(pos, normal, uv = null) {
    this.pos = pos;
    this.normal = normal;
    this.uv = uv;
  }
  clone() {
    return new Vertex(
      this.pos.clone(),
      this.normal.clone(),
      this.uv ? { u: this.uv.u, v: this.uv.v } : null
    );
  }
  flip() { this.normal = this.normal.negated(); }
  interpolate(other, t) {
    const uv = (this.uv && other.uv)
      ? { u: this.uv.u + (other.uv.u - this.uv.u) * t, v: this.uv.v + (other.uv.v - this.uv.v) * t }
      : (this.uv ? { u: this.uv.u, v: this.uv.v } : null);
    return new Vertex(
      this.pos.lerp(other.pos, t),
      this.normal.lerp(other.normal, t).unit(),
      uv
    );
  }
}

// ─── Plane ──────────────────────────────────────────────────────────────────
class Plane {
  constructor(normal, w) {
    this.normal = normal;
    this.w = w;
  }
  clone() { return new Plane(this.normal.clone(), this.w); }
  flip() {
    this.normal = this.normal.negated();
    this.w = -this.w;
  }
  static fromPoints(a, b, c) {
    const n = b.minus(a).cross(c.minus(a)).unit();
    return new Plane(n, n.dot(a));
  }

  splitPolygon(polygon, coplanarFront, coplanarBack, front, back) {
    const COPLANAR = 0, FRONT = 1, BACK = 2, SPANNING = 3;
    let polygonType = 0;
    const types = [];
    const verts = polygon.vertices;

    for (let i = 0; i < verts.length; i++) {
      const t = this.normal.dot(verts[i].pos) - this.w;
      const type = (t < -EPS) ? BACK : (t > EPS) ? FRONT : COPLANAR;
      polygonType |= type;
      types.push(type);
    }

    switch (polygonType) {
      case COPLANAR:
        (this.normal.dot(polygon.plane.normal) > 0 ? coplanarFront : coplanarBack).push(polygon);
        break;
      case FRONT:
        front.push(polygon);
        break;
      case BACK:
        back.push(polygon);
        break;
      case SPANNING: {
        const f = [], b = [];
        for (let i = 0; i < verts.length; i++) {
          const j = (i + 1) % verts.length;
          const ti = types[i], tj = types[j];
          const vi = verts[i], vj = verts[j];
          if (ti !== BACK) f.push(vi);
          if (ti !== FRONT) b.push(ti !== BACK ? vi.clone() : vi);
          if ((ti | tj) === SPANNING) {
            const denom = this.normal.dot(vj.pos.minus(vi.pos));
            const t = Math.abs(denom) > 1e-12
              ? (this.w - this.normal.dot(vi.pos)) / denom
              : 0.5;
            const v = vi.interpolate(vj, t);
            f.push(v);
            b.push(v.clone());
          }
        }
        if (f.length >= 3) front.push(new Polygon(f, polygon.shared));
        if (b.length >= 3) back.push(new Polygon(b, polygon.shared));
        break;
      }
    }
  }
}

// ─── Polygon ────────────────────────────────────────────────────────────────
class Polygon {
  /**
   * @param {Vertex[]} vertices
   * @param {number|object} shared  material/group index (number) or metadata
   */
  constructor(vertices, shared = 0) {
    this.vertices = vertices;
    this.shared = shared;
    this.plane = Plane.fromPoints(vertices[0].pos, vertices[1].pos, vertices[2].pos);
  }
  clone() {
    return new Polygon(this.vertices.map(v => v.clone()), this.shared);
  }
  flip() {
    this.vertices.reverse();
    for (let i = 0; i < this.vertices.length; i++) this.vertices[i].flip();
    this.plane.flip();
  }
}

// ─── BSP Node ───────────────────────────────────────────────────────────────
class Node {
  constructor(polygons) {
    this.plane = null;
    this.front = null;
    this.back = null;
    this.polygons = [];
    if (polygons) this.build(polygons);
  }

  clone() {
    const n = new Node();
    n.plane = this.plane && this.plane.clone();
    n.front = this.front && this.front.clone();
    n.back = this.back && this.back.clone();
    n.polygons = this.polygons.map(p => p.clone());
    return n;
  }

  invert() {
    for (let i = 0; i < this.polygons.length; i++) this.polygons[i].flip();
    if (this.plane) this.plane.flip();
    if (this.front) this.front.invert();
    if (this.back) this.back.invert();
    const tmp = this.front;
    this.front = this.back;
    this.back = tmp;
  }

  clipPolygons(polygons) {
    if (!this.plane) return polygons.slice();
    let front = [], back = [];
    for (let i = 0; i < polygons.length; i++) {
      this.plane.splitPolygon(polygons[i], front, back, front, back);
    }
    if (this.front) front = this.front.clipPolygons(front);
    if (this.back) back = this.back.clipPolygons(back);
    else back = [];
    return front.concat(back);
  }

  clipTo(bsp) {
    this.polygons = bsp.clipPolygons(this.polygons);
    if (this.front) this.front.clipTo(bsp);
    if (this.back) this.back.clipTo(bsp);
  }

  allPolygons() {
    let out = this.polygons.slice();
    if (this.front) out = out.concat(this.front.allPolygons());
    if (this.back) out = out.concat(this.back.allPolygons());
    return out;
  }

  build(polygons) {
    if (!polygons.length) return;
    if (!this.plane) this.plane = polygons[0].plane.clone();
    const front = [], back = [];
    for (let i = 0; i < polygons.length; i++) {
      this.plane.splitPolygon(polygons[i], this.polygons, this.polygons, front, back);
    }
    if (front.length) {
      if (!this.front) this.front = new Node();
      this.front.build(front);
    }
    if (back.length) {
      if (!this.back) this.back = new Node();
      this.back.build(back);
    }
  }
}

// ─── material / group helpers ───────────────────────────────────────────────
function sharedIndex(shared) {
  if (typeof shared === 'number') return shared;
  if (shared && typeof shared.materialIndex === 'number') return shared.materialIndex;
  return 0;
}

// ─── CSG solid ──────────────────────────────────────────────────────────────
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

  // ── three.js bridges ────────────────────────────────────────────────────

  /**
   * Build CSG from BufferGeometry.
   * @param {THREE.BufferGeometry} geometry
   * @param {THREE.Matrix4|null} matrix  world transform
   * @param {object} [opts]
   * @param {boolean} [opts.useGroups=true] honour geometry.groups → shared mat index
   * @param {number} [opts.materialIndex=0] default shared index when no groups
   */
  static fromGeometry(geometry, matrix = null, opts = {}) {
    const useGroups = opts.useGroups !== false;
    const defaultMat = opts.materialIndex || 0;

    let geom = geometry;
    let disposeTmp = false;
    if (geometry.index) {
      geom = geometry.toNonIndexed();
      disposeTmp = true;
    }

    const pos = geom.attributes.position;
    if (!pos) throw new Error('CSG.fromGeometry: no position attribute');
    if (!geom.attributes.normal) geom.computeVertexNormals();
    const normals = geom.attributes.normal;
    const uv = geom.attributes.uv;

    const m = matrix ? matrix.clone() : null;
    const normalMatrix = m ? new THREE.Matrix3().getNormalMatrix(m) : null;
    const tmpV = new THREE.Vector3();
    const tmpN = new THREE.Vector3();

    // Build per-triangle material index from groups
    const triCount = pos.count / 3;
    const matOfTri = new Int32Array(triCount);
    matOfTri.fill(defaultMat);
    if (useGroups && geom.groups && geom.groups.length) {
      for (const g of geom.groups) {
        const startTri = Math.floor(g.start / 3);
        const endTri = Math.floor((g.start + g.count) / 3);
        const mi = g.materialIndex ?? 0;
        for (let t = startTri; t < endTri && t < triCount; t++) matOfTri[t] = mi;
      }
    }

    const polygons = [];
    for (let t = 0; t < triCount; t++) {
      const verts = [];
      for (let k = 0; k < 3; k++) {
        const i = t * 3 + k;
        tmpV.fromBufferAttribute(pos, i);
        if (m) tmpV.applyMatrix4(m);
        tmpN.fromBufferAttribute(normals, i);
        if (normalMatrix) tmpN.applyMatrix3(normalMatrix).normalize();
        const uvCoord = uv ? { u: uv.getX(i), v: uv.getY(i) } : null;
        verts.push(new Vertex(
          new V3(tmpV.x, tmpV.y, tmpV.z),
          new V3(tmpN.x, tmpN.y, tmpN.z),
          uvCoord
        ));
      }
      const e1 = verts[1].pos.minus(verts[0].pos);
      const e2 = verts[2].pos.minus(verts[0].pos);
      if (e1.cross(e2).length() < 1e-12) continue;
      polygons.push(new Polygon(verts, matOfTri[t]));
    }

    if (disposeTmp && geom !== geometry) geom.dispose?.();
    return CSG.fromPolygons(polygons);
  }

  static fromMesh(mesh, opts = {}) {
    mesh.updateWorldMatrix(true, false);
    return CSG.fromGeometry(mesh.geometry, mesh.matrixWorld, opts);
  }

  /**
   * Emit BufferGeometry with optional multi-material groups.
   * @param {object} [opts]
   * @param {boolean} [opts.useGroups=true]
   */
  toGeometry(opts = {}) {
    const useGroups = opts.useGroups !== false;
    const polys = this.polygons;

    // Bucket by material index so groups are contiguous
    const buckets = new Map();
    for (let i = 0; i < polys.length; i++) {
      const mi = sharedIndex(polys[i].shared);
      if (!buckets.has(mi)) buckets.set(mi, []);
      buckets.get(mi).push(polys[i]);
    }

    let triCount = 0;
    for (const list of buckets.values()) {
      for (let i = 0; i < list.length; i++) {
        triCount += Math.max(0, list[i].vertices.length - 2);
      }
    }

    const positions = new Float32Array(triCount * 9);
    const normals = new Float32Array(triCount * 9);
    const uvs = new Float32Array(triCount * 6);
    let p = 0, n = 0, u = 0;
    const groups = [];

    const sortedMats = [...buckets.keys()].sort((a, b) => a - b);
    for (const mi of sortedMats) {
      const list = buckets.get(mi);
      const startVertex = p / 3;
      for (let i = 0; i < list.length; i++) {
        const vs = list[i].vertices;
        for (let j = 1; j < vs.length - 1; j++) {
          const tri = [vs[0], vs[j], vs[j + 1]];
          for (let k = 0; k < 3; k++) {
            const v = tri[k];
            positions[p++] = v.pos.x;
            positions[p++] = v.pos.y;
            positions[p++] = v.pos.z;
            normals[n++] = v.normal.x;
            normals[n++] = v.normal.y;
            normals[n++] = v.normal.z;
            if (v.uv) { uvs[u++] = v.uv.u; uvs[u++] = v.uv.v; }
            else { uvs[u++] = 0; uvs[u++] = 0; }
          }
        }
      }
      const count = p / 3 - startVertex;
      if (useGroups && count > 0) {
        groups.push({ start: startVertex, count, materialIndex: mi });
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    if (useGroups) {
      for (const g of groups) geo.addGroup(g.start, g.count, g.materialIndex);
    }
    geo.computeBoundingBox();
    geo.computeBoundingSphere();
    return geo;
  }

  toMesh(material = null, opts = {}) {
    const geo = this.toGeometry(opts);
    let mat = material;
    if (!mat) {
      mat = new THREE.MeshStandardMaterial({
        color: 0x88aaff,
        metalness: 0.15,
        roughness: 0.45,
        side: THREE.DoubleSide
      });
    }
    // Multi-material array if groups need more slots
    if (Array.isArray(mat) === false && geo.groups.length > 1) {
      // single material is fine; all groups share it unless array provided
    }
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // ── high-level helpers ──────────────────────────────────────────────────

  static _toCSG(input, matrix = null, opts = {}) {
    if (input instanceof CSG) return input;
    if (input && input.isBrush) return CSG.fromMesh(input, opts);
    if (input && input.isMesh) return CSG.fromMesh(input, opts);
    if (input && input.isBufferGeometry) return CSG.fromGeometry(input, matrix, opts);
    throw new Error('CSG: expected Mesh, Brush, BufferGeometry, or CSG solid');
  }

  static _run(op, a, b, opts = {}) {
    const A = CSG._toCSG(a, opts.matrixA, opts);
    const B = CSG._toCSG(b, opts.matrixB, opts);
    let result;
    switch (op) {
      case ADDITION: result = A.union(B); break;
      case SUBTRACTION: result = A.subtract(B); break;
      case REVERSE_SUBTRACTION: result = A.reverseSubtract(B); break;
      case INTERSECTION: result = A.intersect(B); break;
      case DIFFERENCE: result = A.difference(B); break;
      default: throw new Error('CSG: unknown op ' + op);
    }
    if (opts.asCSG) return result;
    if (opts.asGeometry) return result.toGeometry(opts);
    return result.toMesh(opts.material, opts);
  }

  static union(a, b, opts = {}) { return CSG._run(ADDITION, a, b, opts); }
  static subtract(a, b, opts = {}) { return CSG._run(SUBTRACTION, a, b, opts); }
  static reverseSubtract(a, b, opts = {}) { return CSG._run(REVERSE_SUBTRACTION, a, b, opts); }
  static intersect(a, b, opts = {}) { return CSG._run(INTERSECTION, a, b, opts); }
  static difference(a, b, opts = {}) { return CSG._run(DIFFERENCE, a, b, opts); }

  /** Fold many solids: union(a, b, c, …) */
  static unionAll(items, opts = {}) {
    if (!items.length) throw new Error('CSG.unionAll: empty');
    let acc = CSG._toCSG(items[0], null, opts);
    for (let i = 1; i < items.length; i++) {
      acc = acc.union(CSG._toCSG(items[i], null, opts));
    }
    if (opts.asCSG) return acc;
    if (opts.asGeometry) return acc.toGeometry(opts);
    return acc.toMesh(opts.material, opts);
  }

  /** Fold: base − c0 − c1 − … (for multi-window walls etc.) */
  static subtractAll(base, cutters, opts = {}) {
    let acc = CSG._toCSG(base, null, opts);
    for (let i = 0; i < cutters.length; i++) {
      acc = acc.subtract(CSG._toCSG(cutters[i], null, opts));
    }
    if (opts.asCSG) return acc;
    if (opts.asGeometry) return acc.toGeometry(opts);
    return acc.toMesh(opts.material, opts);
  }

  // ── native primitives ───────────────────────────────────────────────────

  static cube({ center = [0, 0, 0], radius = [1, 1, 1], materialIndex = 0 } = {}) {
    const c = new V3(center[0], center[1], center[2]);
    const r = Array.isArray(radius) ? radius : [radius, radius, radius];
    const faces = [
      [[0, 4, 6, 2], [-1, 0, 0]],
      [[1, 3, 7, 5], [+1, 0, 0]],
      [[0, 1, 5, 4], [0, -1, 0]],
      [[2, 6, 7, 3], [0, +1, 0]],
      [[0, 2, 3, 1], [0, 0, -1]],
      [[4, 5, 7, 6], [0, 0, +1]]
    ];
    return CSG.fromPolygons(faces.map(info => new Polygon(info[0].map(i => {
      const pos = new V3(
        c.x + r[0] * (2 * !!(i & 1) - 1),
        c.y + r[1] * (2 * !!(i & 2) - 1),
        c.z + r[2] * (2 * !!(i & 4) - 1)
      );
      return new Vertex(pos, new V3(info[1][0], info[1][1], info[1][2]));
    }), materialIndex)));
  }

  static sphere({ center = [0, 0, 0], radius = 1, slices = 16, stacks = 8, materialIndex = 0 } = {}) {
    const c = new V3(center[0], center[1], center[2]);
    const polygons = [];
    function vertex(theta, phi, out) {
      theta *= Math.PI * 2;
      phi *= Math.PI;
      const dir = new V3(
        Math.cos(theta) * Math.sin(phi),
        Math.cos(phi),
        Math.sin(theta) * Math.sin(phi)
      );
      out.push(new Vertex(c.plus(dir.times(radius)), dir));
    }
    for (let i = 0; i < slices; i++) {
      for (let j = 0; j < stacks; j++) {
        const verts = [];
        vertex(i / slices, j / stacks, verts);
        if (j > 0) vertex((i + 1) / slices, j / stacks, verts);
        if (j < stacks - 1) vertex((i + 1) / slices, (j + 1) / stacks, verts);
        vertex(i / slices, (j + 1) / stacks, verts);
        polygons.push(new Polygon(verts, materialIndex));
      }
    }
    return CSG.fromPolygons(polygons);
  }

  static cylinder({
    start = [0, -1, 0], end = [0, 1, 0], radius = 1, slices = 16, materialIndex = 0
  } = {}) {
    const s = new V3(start[0], start[1], start[2]);
    const e = new V3(end[0], end[1], end[2]);
    const ray = e.minus(s);
    const axisZ = ray.unit();
    const isY = Math.abs(axisZ.y) > 0.5;
    const axisX = new V3(isY ? 1 : 0, isY ? 0 : 1, 0).cross(axisZ).unit();
    const axisY = axisX.cross(axisZ).unit();
    const startV = new Vertex(s, axisZ.negated());
    const endV = new Vertex(e, axisZ.clone());
    const polygons = [];
    function point(stack, slice, normalBlend) {
      const angle = slice * Math.PI * 2;
      const out = axisX.times(Math.cos(angle)).plus(axisY.times(Math.sin(angle)));
      const pos = s.plus(ray.times(stack)).plus(out.times(radius));
      const normal = out.times(1 - Math.abs(normalBlend)).plus(axisZ.times(normalBlend));
      return new Vertex(pos, normal.unit());
    }
    for (let i = 0; i < slices; i++) {
      const t0 = i / slices, t1 = (i + 1) / slices;
      polygons.push(new Polygon([startV, point(0, t0, -1), point(0, t1, -1)], materialIndex));
      polygons.push(new Polygon([point(0, t1, 0), point(0, t0, 0), point(1, t0, 0), point(1, t1, 0)], materialIndex));
      polygons.push(new Polygon([endV, point(1, t1, 1), point(1, t0, 1)], materialIndex));
    }
    return CSG.fromPolygons(polygons);
  }

  /**
   * Axis-aligned box from min/max corners (handy for door/window cutters).
   * Oversize slightly on the wall-normal axis so cut faces don't z-fight.
   */
  static boxFromBounds(min, max, materialIndex = 0) {
    const cx = (min[0] + max[0]) * 0.5;
    const cy = (min[1] + max[1]) * 0.5;
    const cz = (min[2] + max[2]) * 0.5;
    const rx = Math.abs(max[0] - min[0]) * 0.5;
    const ry = Math.abs(max[1] - min[1]) * 0.5;
    const rz = Math.abs(max[2] - min[2]) * 0.5;
    return CSG.cube({ center: [cx, cy, cz], radius: [rx, ry, rz], materialIndex });
  }
}

// ─── Brush (Mesh-compatible operand, three-bvh-csg shape) ───────────────────
export class Brush extends THREE.Mesh {
  constructor(geometry = new THREE.BufferGeometry(), material) {
    super(
      geometry,
      material || new THREE.MeshStandardMaterial({ color: 0xcccccc, side: THREE.DoubleSide })
    );
    this.isBrush = true;
    this.type = 'Brush';
  }

  /** Refresh matrixWorld before evaluate (required). */
  prepare() {
    this.updateMatrixWorld(true);
    return this;
  }

  toCSG(opts = {}) {
    this.prepare();
    return CSG.fromMesh(this, opts);
  }
}

// ─── Evaluator ──────────────────────────────────────────────────────────────
export class Evaluator {
  constructor() {
    /** Honour geometry groups / multi-material (default true). */
    this.useGroups = true;
  }

  /**
   * @param {Brush|THREE.Mesh|CSG} a
   * @param {Brush|THREE.Mesh|CSG} b
   * @param {string} operation  ADDITION | SUBTRACTION | …
   * @param {Brush|THREE.Mesh|null} target  optional reuse
   * @returns {Brush}
   */
  evaluate(a, b, operation, target = null) {
    const opts = { useGroups: this.useGroups, asCSG: true };
    const result = CSG._run(operation, a, b, opts);
    const geo = result.toGeometry({ useGroups: this.useGroups });

    if (target) {
      if (target.geometry && target.geometry !== geo) target.geometry.dispose?.();
      target.geometry = geo;
      return target;
    }

    // Prefer material from A when it's a mesh
    let mat = null;
    if (a && a.material) mat = a.material;
    return new Brush(geo, mat);
  }

  /**
   * Evaluate a chain: start with brushes[0], then fold ops[i] with brushes[i+1].
   * ops.length === brushes.length - 1
   */
  evaluateChain(brushes, operations) {
    if (!brushes.length) throw new Error('Evaluator.evaluateChain: no brushes');
    if (operations.length !== brushes.length - 1) {
      throw new Error('Evaluator.evaluateChain: ops length must be brushes.length - 1');
    }
    let acc = brushes[0];
    for (let i = 0; i < operations.length; i++) {
      acc = this.evaluate(acc, brushes[i + 1], operations[i]);
    }
    return acc;
  }
}

// ─── Prefab helpers (the door/window gap problem) ───────────────────────────
/**
 * Build a wall slab and cut rectangular openings in one manifold mesh.
 * Avoids z-fighting stacks and door/frame gaps from floating geometry.
 *
 * Opening: { x, y, w, h, z? } in wall local space (origin = wall center).
 * Wall faces ±Z by default; cutter overshoots thickness so cuts are clean.
 *
 * @returns {{ mesh: THREE.Mesh, csg: CSG, openings: object[] }}
 */
export function wallWithOpenings(options = {}) {
  const {
    width = 4,
    height = 3,
    thickness = 0.25,
    openings = [],
    wallMaterial = null,
    cutterOvershoot = 0.05, // poke through both faces — kills coplanar z-fight
    materialIndex = 0
  } = options;

  let wall = CSG.cube({
    center: [0, 0, 0],
    radius: [width * 0.5, height * 0.5, thickness * 0.5],
    materialIndex
  });

  const halfT = thickness * 0.5 + cutterOvershoot;

  for (const op of openings) {
    const ox = op.x ?? 0;
    const oy = op.y ?? 0;
    const ow = op.w ?? 1;
    const oh = op.h ?? 2;
    // Cutter is thicker than wall so subtraction cleanly pierces
    const cutter = CSG.cube({
      center: [ox, oy, op.z ?? 0],
      radius: [ow * 0.5, oh * 0.5, halfT],
      materialIndex: op.materialIndex ?? materialIndex
    });
    wall = wall.subtract(cutter);
  }

  const mat = wallMaterial || new THREE.MeshStandardMaterial({
    color: 0xc4b7a6,
    roughness: 0.85,
    metalness: 0.05,
    side: THREE.DoubleSide
  });

  return {
    mesh: wall.toMesh(mat),
    csg: wall,
    openings
  };
}

/**
 * Door frame that *fits* an opening (no gaps). Outer size = opening;
 * subtract inner free space. Overshoots wall depth like the cutter.
 */
export function doorFrame(options = {}) {
  const {
    openingW = 1.0,
    openingH = 2.1,
    depth = 0.3,
    frameThickness = 0.08,
    sill = 0.04,
    material = null,
    materialIndex = 0
  } = options;

  const outer = CSG.cube({
    center: [0, 0, 0],
    radius: [openingW * 0.5, openingH * 0.5, depth * 0.5],
    materialIndex
  });
  const innerW = Math.max(0.05, openingW - frameThickness * 2);
  const innerH = Math.max(0.05, openingH - frameThickness - sill);
  const innerY = (sill - frameThickness) * 0.5;
  const inner = CSG.cube({
    center: [0, innerY, 0],
    radius: [innerW * 0.5, innerH * 0.5, depth * 0.5 + 0.02],
    materialIndex
  });
  const frame = outer.subtract(inner);
  const mat = material || new THREE.MeshStandardMaterial({
    color: 0x5c4033,
    roughness: 0.7,
    metalness: 0.05,
    side: THREE.DoubleSide
  });
  return { mesh: frame.toMesh(mat), csg: frame };
}

/**
 * Wall + fitted door frame as a single group (or merged mesh).
 * Solves: "kernel architecture still often creates gaps between doors and frames"
 */
export function wallWithDoor(options = {}) {
  const {
    width = 4,
    height = 3,
    thickness = 0.25,
    doorW = 1.0,
    doorH = 2.1,
    doorX = 0,
    doorY = null, // default: bottom-aligned
    frameThickness = 0.08,
    merge = false,
    wallMaterial = null,
    frameMaterial = null
  } = options;

  const dy = doorY != null ? doorY : (-height * 0.5 + doorH * 0.5);
  const wall = wallWithOpenings({
    width, height, thickness,
    openings: [{ x: doorX, y: dy, w: doorW, h: doorH }],
    wallMaterial
  });

  const frame = doorFrame({
    openingW: doorW,
    openingH: doorH,
    depth: thickness + 0.04,
    frameThickness,
    material: frameMaterial
  });
  frame.mesh.position.set(doorX, dy, 0);

  if (merge) {
    // Union wall solid with frame solid (frame already fits opening)
    frame.mesh.updateWorldMatrix(true, false);
    const frameCSG = CSG.fromMesh(frame.mesh);
    const merged = wall.csg.union(frameCSG);
    return {
      mesh: merged.toMesh(wallMaterial || frameMaterial),
      csg: merged,
      wall,
      frame
    };
  }

  const group = new THREE.Group();
  group.name = 'wallWithDoor';
  group.add(wall.mesh);
  group.add(frame.mesh);
  return { group, wall, frame };
}

export default CSG;
