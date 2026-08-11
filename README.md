# csg-kernel

**Proper BSP Constructive Solid Geometry for [three.js](https://threejs.org/).**

Boolean ops that produce real meshes — not stacked boxes that z-fight.

```bash
npm install csg-kernel three
```

```js
import { CSG, wallWithDoor, Brush, Evaluator, SUBTRACTION } from 'csg-kernel';

scene.add(CSG.subtract(boxMesh, sphereMesh));

const { group } = wallWithDoor({ width: 5, height: 3, doorW: 1.05, doorH: 2.15 });
scene.add(group);
```

---

## Install (customers)

### npm (after publish)

```bash
npm install csg-kernel three
# or
pnpm add csg-kernel three
# or
yarn add csg-kernel three
```

### From GitHub (works now)

```bash
npm install github:BHTANK/csg-kernel three
```

### npx (no install required for demos / scaffold)

```bash
# Interactive help
npx csg-kernel

# Scaffold a browser project
npx csg-kernel init my-csg-app
cd my-csg-app && npm install && npm start

# Serve package demos
npx csg-kernel demo
# → http://localhost:5177
```

---

## API (short)

| Export | Role |
|--------|------|
| `CSG.union / subtract / intersect / difference` | Mesh or geometry booleans |
| `CSG.unionAll / subtractAll` | Multi-cutter walls |
| `Brush` + `Evaluator` | three-bvh-csg-shaped API |
| `wallWithOpenings` / `doorFrame` / `wallWithDoor` | Gap-free prefab helpers |
| `ADDITION`, `SUBTRACTION`, … | Op constants |
| `csg-kernel/mono` | Single-file build (optional) |

```js
import { CSG, SUBTRACTION, Brush, Evaluator } from 'csg-kernel';
// or
import { CSG } from 'csg-kernel/mono';
```

Peer: **`three` ≥ 0.150**.

---

## Why

Stacking wall + window + frame → z-fighting and door gaps.  
Convex plane-brushes can’t cut freeform openings.  
This package is a clear BSP kernel wired to **BufferGeometry**, **world matrices**, and **multi-material groups**.

---

## License

MIT. BSP algorithm © 2011 Evan Wallace. Bridge & packaging © BHTANK.
