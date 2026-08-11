# Credits & creators

**csg-kernel** ships original BHTANK packaging *and* code/patterns derived from
other creators. When anything of theirs is used, their identity and license are
recorded here. **Do not remove this file from redistributions.**

---

## Package authors (this project)

| Who | Role | Links |
|-----|------|--------|
| **BHTANK** | Package author — three.js BufferGeometry bridge, Brush/Evaluator API shape for this package, wall/door/window prefabs, CLI/npx packaging, assembly kit, docs | https://github.com/BHTANK · https://github.com/BHTANK/csg-kernel |

License for original BHTANK work: **MIT** (see `LICENSE`).

---

## Third-party code lineage (used in this package)

### 1. BSP constructive solid geometry algorithm

| Field | Detail |
|-------|--------|
| **Creator** | **Evan Wallace** |
| **Work** | [csg.js](https://github.com/evanw/csg.js) — elegant BSP CSG (union / subtract / intersect) |
| **Used where** | `src/bsp.js`, solid ops in `src/csg.js`, mono build `CSGKernel.mono.js` |
| **How used** | Algorithm rewritten as modern ES modules for BufferGeometry; coplanar split rules and `clipTo` / `invert` / `build` flow follow Wallace |
| **License** | **MIT** |
| **Copyright** | Copyright (c) 2011 Evan Wallace (http://madebyevan.com/) |
| **Homepage** | https://evanw.github.io/csg.js/ · https://github.com/evanw/csg.js |

> Required notice (from csg.js):  
> *Copyright (c) 2011 Evan Wallace (http://madebyevan.com/), under the MIT license.*

### 2. three.js (peer dependency — not bundled)

| Field | Detail |
|-------|--------|
| **Creator / lead** | **Ricardo Cabello (mrdoob)** and [three.js contributors](https://github.com/mrdoob/three.js/graphs/contributors) |
| **Work** | [three.js](https://threejs.org/) — WebGL/WebGPU 3D library |
| **Used where** | Peer dependency; imports of `three` in all runtime modules and demos |
| **How used** | Mesh, BufferGeometry, materials, math — not vendored; customers install `three` separately |
| **License** | **MIT** |
| **Copyright** | Copyright © 2010-present three.js authors |
| **Homepage** | https://threejs.org/ · https://github.com/mrdoob/three.js |

### 3. three.js examples / addons library (catalog reference only)

| Field | Detail |
|-------|--------|
| **Creator / lead** | **mrdoob** and three.js examples contributors |
| **Work** | Official examples suite + `examples/jsm` addons (loaders, controls, postprocessing, TSL, …) |
| **Used where** | `kit/helpers-catalog.json` — **index of module paths only** (names/paths of jsm modules and example HTML files). **No three.js example source, models, or textures are redistributed in this npm package.** |
| **How used** | Offline “Three.js Helpers” kit on Tank’s machine is a local clone of the examples tree (r185-era). The catalog helps assemble CSG + jsm tools; run examples from your local Helpers folder or threejs.org |
| **License** | **MIT** (same as three.js) |
| **Homepage** | https://threejs.org/examples/ · https://github.com/mrdoob/three.js/tree/dev/examples |

### 4. Brush / Evaluator API *shape* (inspiration, not a code copy)

| Field | Detail |
|-------|--------|
| **Creator** | **Garrett Johnson (gkjohnson)** |
| **Work** | [three-bvh-csg](https://github.com/gkjohnson/three-bvh-csg) — BVH-accelerated CSG for three.js |
| **Used where** | Naming/shape of `Brush`, `Evaluator`, op constants (`ADDITION`, `SUBTRACTION`, …) in `src/brush.js` / exports |
| **How used** | **API familiarity only** — this package’s boolean *implementation* is BSP (Wallace), not three-mesh-bvh. We do **not** ship three-bvh-csg or three-mesh-bvh source |
| **License** | **MIT** |
| **Homepage** | https://github.com/gkjohnson/three-bvh-csg · https://github.com/gkjohnson/three-mesh-bvh |

### 5. Problem framing (community / product context — no code copied)

| Field | Detail |
|-------|--------|
| **Creator** | **robot 2.0 / @alightinastorm** (and vibe-stack / GGEZ ecosystem) |
| **Work** | Public discussion of web CSG kernels, procedural three.js props/prefabs, `@ggez/geometry-kernel`, three-roads, etc. |
| **Used where** | Docs/README motivation (wall/door gaps, z-fighting, “no good kernels”) |
| **How used** | **Inspiration only** — zero lines of their proprietary code are included |
| **Links** | https://x.com/alightinastorm · https://github.com/alightinastorm · npm `@ggez/*` |

---

## Optional local tools (not published inside the tarball)

These may appear on a developer machine next to this package; they are **not**
shipped as npm package contents unless separately licensed and added:

| Work | Creator | Notes |
|------|---------|--------|
| Local “Three.js Helpers” folder (examples + jsm + assets) | mrdoob / three.js contributors | Full examples clone; run offline via their launcher |
| Manifold CAD | Emmett Lalish et al. | Not used in this package; community alternative for CAD-grade CSG |
| OpenCASCADE / occt-import-js | Various | Not bundled |

---

## How to attribute when you ship a product

If your product includes **csg-kernel**, retain:

1. This `CREDITS.md` (or equivalent notices)
2. `LICENSE` (MIT for BHTANK packaging)
3. Evan Wallace MIT notice for the BSP algorithm
4. three.js MIT notice if you redistribute three.js itself (peer install is enough for most apps)

Suggested short blurb:

```text
This product uses csg-kernel (MIT © BHTANK), with BSP CSG based on
csg.js by Evan Wallace (MIT © 2011), and three.js by mrdoob and contributors (MIT).
```

---

## Machine-readable summary

See `NOTICE` (SPDX-style one-liners) and `package.json` → `contributors` / `funding` fields.

Last updated: 2026-08-11.
