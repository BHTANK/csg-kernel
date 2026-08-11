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
pnpm add csg-kernel three
yarn add csg-kernel three
```

### From GitHub (works now)

```bash
npm install github:BHTANK/csg-kernel three
```

### npx

```bash
npx github:BHTANK/csg-kernel
npx github:BHTANK/csg-kernel init my-csg-app
npx github:BHTANK/csg-kernel demo
```

After the package is on the npm registry:

```bash
npx csg-kernel
npx csg-kernel init my-csg-app
npx csg-kernel demo
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

Peer: **`three` ≥ 0.150**.

---

## License

MIT. BSP algorithm © 2011 Evan Wallace. Bridge & packaging © BHTANK.
