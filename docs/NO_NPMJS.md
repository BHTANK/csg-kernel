# Using csg-kernel **without** an npmjs.com account

You do **not** need to register or publish on https://www.npmjs.com.

This machine already has the **Node tools** (`node`, `npm`, `npx`).  
“No npm installation” usually means **no npmjs registry login** — that’s fine.

---

## Option A — Browser only (no Node, no registry)

Load the package straight from **GitHub via jsDelivr** (CDN mirrors the repo):

```html
<script type="importmap">
{
  "imports": {
    "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
    "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/",
    "csg-kernel": "https://cdn.jsdelivr.net/gh/BHTANK/csg-kernel@main/CSGKernel.js",
    "csg-kernel/": "https://cdn.jsdelivr.net/gh/BHTANK/csg-kernel@main/"
  }
}
</script>
<script type="module">
  import * as THREE from 'three';
  import { CSG, wallWithDoor } from 'csg-kernel';

  const box = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2));
  const ball = new THREE.Mesh(new THREE.SphereGeometry(1.2, 24, 16));
  ball.position.set(0.5, 0.3, 0);
  const mesh = CSG.subtract(box, ball);
  // scene.add(mesh);
</script>
```

Or open the ready file in this package:

- `templates/cdn-demo.html`

**Creators:** see `CREDITS.md` (Evan Wallace / csg.js, mrdoob / three.js, BHTANK).

---

## Option B — Local folder (no registry)

```bash
cd your-project
npm install /home/tank/Desktop/csg-kernel-npm
npm install three
```

If npm blocks git (`EALLOWGIT`), use **file:** paths, not `github:…`.

---

## Option C — Clone from GitHub

```bash
git clone https://github.com/BHTANK/csg-kernel.git
cd your-project
npm install ./csg-kernel three
```

---

## Option D — CLI without publish

```bash
node /home/tank/Desktop/csg-kernel-npm/bin/csg-kernel.js demo
node /home/tank/Desktop/csg-kernel-npm/bin/csg-kernel.js credits
```

---

## You only need npmjs.com for

```bash
npm publish   # optional: public registry name for strangers
```

Customers can use A–D forever without that.
