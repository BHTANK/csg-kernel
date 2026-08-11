# Integrating with Three.js Helpers (local kit)

Your offline **Three.js Helpers** folder is the full official three.js **examples**
tree (gallery + `jsm/` addons + assets), maintained for local/offline use.

## Creators

| Work | Creator | License |
|------|---------|---------|
| three.js + examples/jsm | **Ricardo Cabello (mrdoob)** and contributors | MIT |
| This integration doc + catalog | **BHTANK** | MIT |

**We do not redistribute** the 400+ MB examples assets inside the npm package.
`kit/helpers-catalog.json` only lists **module and example paths** so you can
compose CSG with the right addons.

## Typical layout (on this PC)

```
…/Build and Learn Center/Three.js Helpers/
  build/          three.js builds
  jsm/            addons (loaders, controls, postprocessing, TSL, …)
  models/ textures/ …
  webgl/ webgpu/ …  examples
  Open Three.js Helpers.sh
  HOW_IT_WORKS.md
```

## Combine with csg-kernel

1. Boolean-model your solid with `csg-kernel` (BSP © Evan Wallace / csg.js).
2. Load/display with three.js (© mrdoob).
3. Pull addons from **your** Helpers `jsm/` or from `three/addons/` after `npm i three`:

```js
import { CSG, wallWithDoor } from 'csg-kernel';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
```

## Catalog API

```js
import {
  helpersCatalog,
  listJsmCategories,
  listJsmModules
} from 'csg-kernel/kit';

listJsmCategories();           // ['animation','controls','loaders',…]
listJsmModules('loaders');     // relative paths under jsm/loaders/
helpersCatalog.examples.webgl; // example HTML names
```

## Attribution when shipping

If you ship apps using this package + three.js + (optionally) example patterns,
keep notices from `CREDITS.md` / `NOTICE`. Example blurb:

> Uses csg-kernel (MIT © BHTANK; BSP based on csg.js by Evan Wallace, MIT) and
> three.js (MIT © mrdoob and contributors).
