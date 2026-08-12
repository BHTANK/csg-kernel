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
    const n = b
