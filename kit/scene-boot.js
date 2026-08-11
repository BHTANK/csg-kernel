/**
 * kit/scene-boot.js — minimal three.js scene boot for demos / scaffolds.
 *
 * three.js © mrdoob & contributors (MIT) — peer dependency.
 * Boot helper © BHTANK (MIT). Credits: CREDITS.md
 */

import * as THREE from 'three';

/**
 * @param {HTMLElement|null} container
 * @param {object} [opts]
 */
export function createDemoScene(container = document.body, opts = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
  renderer.setSize(globalThis.innerWidth || 800, globalThis.innerHeight || 600);
  renderer.setClearColor(opts.clearColor ?? 0x0a0c10, 1);
  if (container?.appendChild) container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  if (opts.fog !== false) scene.fog = new THREE.Fog(opts.clearColor ?? 0x0a0c10, 14, 40);

  const camera = new THREE.PerspectiveCamera(
    opts.fov ?? 45,
    (globalThis.innerWidth || 800) / (globalThis.innerHeight || 600),
    0.1,
    200
  );
  camera.position.set(opts.camX ?? 5.2, opts.camY ?? 3.2, opts.camZ ?? 6.4);

  scene.add(new THREE.AmbientLight(0x6080a0, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(6, 10, 4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x6eb6ff, 0.3);
  fill.position.set(-5, 3, -4);
  scene.add(fill);

  if (opts.ground !== false) {
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(12, 48),
      new THREE.MeshStandardMaterial({ color: 0x141a22, roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = opts.groundY ?? -1.5;
    scene.add(ground);
    const grid = new THREE.GridHelper(12, 24, 0x243044, 0x151c28);
    grid.position.y = (opts.groundY ?? -1.5) + 0.01;
    scene.add(grid);
  }

  function onResize() {
    const w = globalThis.innerWidth || 800;
    const h = globalThis.innerHeight || 600;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  if (globalThis.addEventListener) globalThis.addEventListener('resize', onResize);

  return { renderer, scene, camera, onResize };
}
