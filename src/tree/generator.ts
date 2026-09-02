import * as THREE from "three";
import type { TreeParams, TreeSkeleton, Branch, Leaf } from "./types";
import { makeRng, range } from "./rng";

const DEG = Math.PI / 180;

/**
 * Generate a tree skeleton (branches + leaf positions) from parameters.
 * Simplified Weber-Penn: recursive branching with golden-angle spread.
 */
export function generateTree(p: TreeParams): TreeSkeleton {
  const rng = makeRng(p.seed);
  const branches: Branch[] = [];
  const leaves: Leaf[] = [];

  // scratch vectors (reused across recursion to avoid GC pressure)
  const dir = new THREE.Vector3(0, 1, 0);
  const pos = new THREE.Vector3(0, 0, 0);

  function recurse(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    length: number,
    radius: number,
    level: number,
    angleAccum: number,
  ) {
    const end = origin.clone().addScaledVector(direction, length);
    branches.push({
      start: { x: origin.x, y: origin.y, z: origin.z },
      end: { x: end.x, y: end.y, z: end.z },
      startRadius: radius,
      endRadius: radius * p.radiusFalloff,
    });

    if (level >= p.levels) {
      // terminal branch → spawn leaves
      for (let i = 0; i < p.leavesPerTip; i++) {
        const t = range(rng, 0.3, 1.0);
        const lp = origin.clone().lerp(end, t);
        // random offset perpendicular to branch
        const perp = new THREE.Vector3(
          range(rng, -1, 1),
          range(rng, -0.3, 0.5),
          range(rng, -1, 1),
        ).normalize();
        lp.addScaledVector(perp, range(rng, 0.1, 0.6));
        const normal = perp.clone().normalize();
        leaves.push({
          position: { x: lp.x, y: lp.y, z: lp.z },
          normal: { x: normal.x, y: normal.y, z: normal.z },
          size: p.leafSize * range(rng, 0.7, 1.3),
          color: [
            p.leafColor[0] * range(rng, 0.85, 1.15),
            p.leafColor[1] * range(rng, 0.85, 1.15),
            p.leafColor[2] * range(rng, 0.85, 1.15),
          ],
        });
      }
      return;
    }

    const childLen = length * p.lengthFalloff;
    const childRad = radius * p.radiusFalloff;
    const n = p.branchesPerLevel;

    for (let i = 0; i < n; i++) {
      // golden-angle spread around parent axis
      const phi = (angleAccum + i * p.spread) * DEG;
      const theta = (p.branchAngle + range(rng, -8, 8)) * DEG;
      const downBias = p.downAngle * DEG * range(rng, 0.5, 1.0);

      // build child direction
      const childDir = new THREE.Vector3(
        Math.sin(theta) * Math.cos(phi),
        Math.cos(theta) - Math.sin(downBias),
        Math.sin(theta) * Math.sin(phi),
      ).normalize();

      // blend with parent direction for smoothness
      childDir.lerp(direction, 0.25).normalize();

      // jitter child length ±15%
      const jitteredLen = childLen * range(rng, 0.85, 1.15);

      recurse(
        end,
        childDir,
        jitteredLen,
        childRad,
        level + 1,
        angleAccum + i * p.spread + range(rng, -10, 10),
      );
    }
  }

  recurse(pos, dir, p.trunkHeight, p.trunkRadius, 0, 0);

  return { branches, leaves };
}
