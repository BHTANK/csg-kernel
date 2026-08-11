/**
 * recipes/ — ready boolean recipes for common game/asset solids.
 *
 * CSG algorithm: Evan Wallace csg.js (MIT). Prefabs/recipes: BHTANK (MIT).
 * Credits: CREDITS.md
 */

import { CSG, wallWithOpenings, doorFrame, wallWithDoor } from '../CSGKernel.js';
import { assemble, placeBoxCutter } from '../kit/assembly.js';

export { wallWithOpenings, doorFrame, wallWithDoor };

/** Hollow box shell (outer − inner). */
export function hollowBox({
  outer = [2, 2, 2],
  thickness = 0.15,
  materialIndex = 0
} = {}) {
  const o = CSG.cube({
    center: [0, 0, 0],
    radius: [outer[0] / 2, outer[1] / 2, outer[2] / 2],
    materialIndex
  });
  const ix = Math.max(0.05, outer[0] / 2 - thickness);
  const iy = Math.max(0.05, outer[1] / 2 - thickness);
  const iz = Math.max(0.05, outer[2] / 2 - thickness);
  const inner = CSG.cube({
    center: [0, 0, 0],
    radius: [ix, iy, iz],
    materialIndex
  });
  return o.subtract(inner);
}

/** Pipe segment: cylinder shell. */
export function pipeSegment({
  radius = 0.5,
  height = 2,
  wall = 0.08,
  slices = 24,
  materialIndex = 0
} = {}) {
  const outer = CSG.cylinder({
    start: [0, -height / 2, 0],
    end: [0, height / 2, 0],
    radius,
    slices,
    materialIndex
  });
  const inner = CSG.cylinder({
    start: [0, -height / 2 - 0.01, 0],
    end: [0, height / 2 + 0.01, 0],
    radius: Math.max(0.02, radius - wall),
    slices,
    materialIndex
  });
  return outer.subtract(inner);
}

/** Plate with N circular bolt holes. */
export function plateWithHoles({
  width = 2,
  height = 0.15,
  depth = 2,
  holes = [[0, 0, 0.25]],
  materialIndex = 0
} = {}) {
  let plate = CSG.cube({
    center: [0, 0, 0],
    radius: [width / 2, height / 2, depth / 2],
    materialIndex
  });
  for (const h of holes) {
    const [x, z, r] = h;
    const cutter = CSG.cylinder({
      start: [x, -height, z],
      end: [x, height, z],
      radius: r,
      slices: 20,
      materialIndex
    });
    plate = plate.subtract(cutter);
  }
  return plate;
}

/** Facade: wall slab with window grid. */
export function windowFacade({
  width = 6,
  height = 3.2,
  thickness = 0.28,
  cols = 3,
  rows = 2,
  winW = 1.0,
  winH = 1.0,
  marginX = 0.4,
  marginY = 0.35
} = {}) {
  const openings = [];
  const usableW = width - marginX * 2;
  const usableH = height - marginY * 2;
  const gapX = cols > 1 ? (usableW - cols * winW) / (cols - 1) : 0;
  const gapY = rows > 1 ? (usableH - rows * winH) / (rows - 1) : 0;
  const x0 = -width / 2 + marginX + winW / 2;
  const y0 = -height / 2 + marginY + winH / 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      openings.push({
        x: x0 + c * (winW + gapX),
        y: y0 + r * (winH + gapY),
        w: winW,
        h: winH
      });
    }
  }
  return wallWithOpenings({ width, height, thickness, openings });
}

export { assemble, placeBoxCutter };
