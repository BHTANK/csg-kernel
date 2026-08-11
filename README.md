# csg-kernel

**Proper BSP Constructive Solid Geometry for [three.js](https://threejs.org/).**

Boolean ops that produce real meshes — not stacked boxes that z-fight.

```bash
npm install csg-kernel three
# or (works now)
npm install github:BHTANK/csg-kernel three
```

```js
import { CSG, wallWithDoor, Brush, Evaluator, SUBTRACTION } from 'csg-kernel';
import { assemble, helpersCatalog } from 'csg-kernel/kit';
import { hollowBox, windowFacade } from 'csg-kernel/recipes';

scene.add(CSG.subtract(boxMesh, sphereMesh));
const { group } = wallWithDoor({ width: 5, height: 3, doorW: 1.05, doorH: 2.15 });
scene.add(group);
```

---

## Creators & attribution

**Every third-party lineage used in this package is credited.** See:

| File | Purpose |
|------|---------|
| [`CREDITS.md`](./CREDITS.md) | Full human-readable creators table |
| [`NOTICE`](./NOTICE) | SPDX-style third-party notices |
| [`AUTHORS`](./AUTHORS) | Authors list |
| [`LICENSE`](./LICENSE) | MIT + embedded third-party MIT notices |

| Creator | Contribution |
|---------|----------------|
| **Evan Wallace** | BSP CSG algorithm ([csg.js](https://github.com/evanw/csg.js), MIT © 2011) |
| **mrdoob** & three.js contributors | Peer library [three.js](https://threejs.org/) (MIT) |
| **Garrett Johnson (gkjohnson)** | Brush/Evaluator *API shape* inspiration ([three-bvh-csg](https://github.com/gkjohnson/three-bvh-csg), MIT) — not a source fork |
| **BHTANK** | BufferGeometry bridge, prefabs, kit, recipes, CLI, packaging (MIT © 2026) |
| **@alightinastorm** (docs only) | Problem framing for wall/door gaps — **no code copied** |

```bash
npx csg-kernel credits
```

---

## Install

```bash
npm install csg-kernel three
npm install github:BHTANK/csg-kernel three   # GitHub direct
```

### npx

```bash
npx github:BHTANK/csg-kernel
npx github:BHTANK/csg-kernel init my-csg-app
npx github:BHTANK/csg-kernel demo
npx github:BHTANK/csg-kernel credits
```

---

## Packages / exports

| Import | Contents |
|--------|----------|
| `csg-kernel` | CSG, Brush, Evaluator, prefabs, ops |
| `csg-kernel/kit` | assemble, mesh-utils, scene-boot, helpers catalog |
| `csg-kernel/recipes` | hollowBox, pipeSegment, plateWithHoles, windowFacade, wall/door |
| `csg-kernel/mono` | Single-file build |

Peer: **`three` ≥ 0.150**.

### Three.js Helpers (local)

Your offline Helpers kit (examples + `jsm/`) is **mrdoob’s three.js examples tree**.  
We ship only a **path catalog** (`kit/helpers-catalog.*`) — not the 400 MB assets.  
See [`docs/HELPERS_INTEGRATION.md`](./docs/HELPERS_INTEGRATION.md).

---

## License

MIT © BHTANK, with third-party notices for Evan Wallace (csg.js) and three.js authors.  
Full text: `LICENSE` · `CREDITS.md` · `NOTICE`.
