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

    const spawnLeaves = (count: number) => {
      for (let i = 0; i < count; i++) {
        const t = range(rng, 0.2, 1.0);
        const lp = origin.clone().lerp(end, t);
        // tight offset hugging the branch
        const perp = new THREE.Vector3(
          range(rng, -1, 1),
          range(rng, -0.4, 0.6),
          range(rng, -1, 1),
        ).normalize();
        lp.addScaledVector(perp, range(rng, 0.05, 0.35));
        const normal = perp.clone().normalize();
        // 30% young leaves (yellowish, sun-lit) vs mature (deep green) → breaks flat single-green
        const young = rng() < 0.3;
        const base: [number, number, number] = young
          ? [p.leafColor[0] * 1.35, p.leafColor[1] * 1.2, p.leafColor[2] * 0.55]
          : p.leafColor;
        leaves.push({
          position: { x: lp.x, y: lp.y, z: lp.z },
          normal: { x: normal.x, y: normal.y, z: normal.z },
          size: p.leafSize * range(rng, 0.7, 1.3),
          color: [
            base[0] * range(rng, 0.85, 1.15),
            base[1] * range(rng, 0.85, 1.15),
            base[2] * range(rng, 0.85, 1.15),
          ],
        });
      }
    };

    if (level >= p.levels) {
      spawnLeaves(p.leavesPerTip);
      return;
    }
    // one level above terminal: half leaves so canopy hugs inner branches too
    if (level === p.levels - 1) spawnLeaves(Math.round(p.leavesPerTip / 2));

    const n = p.branchesPerLevel;

    for (let i = 0; i < n; i++) {
      // first child = leader: continues nearly straight, longer (dominant-stem growth)
      // remaining children spread wider and shorter — breaks the uniform Y-fork pattern
      const isLeader = i === 0;
      const theta = (isLeader ? range(rng, 8, 16) : p.branchAngle + range(rng, -12, 12)) * DEG;
      const phi = (angleAccum + i * p.spread) * DEG;
      const downBias = p.downAngle * DEG * range(rng, 0.5, 1.0);

      // build child direction
      const childDir = new THREE.Vector3(
        Math.sin(theta) * Math.cos(phi),
        Math.cos(theta) - Math.sin(downBias),
        Math.sin(theta) * Math.sin(phi),
      ).normalize();

      // blend with parent direction for smoothness (leader stronger)
      childDir.lerp(direction, isLeader ? 0.55 : 0.2).normalize();

      const childLen =
        length * p.lengthFalloff * (isLeader ? range(rng, 0.95, 1.1) : range(rng, 0.65, 0.9));
      const childRad = radius * (isLeader ? p.radiusFalloff * 1.05 : p.radiusFalloff * 0.85);

      recurse(
        end,
        childDir,
        childLen,
        childRad,
        level + 1,
        angleAccum + i * p.spread + range(rng, -10, 10),
      );
    }
  }

  // slight trunk lean for naturalism
  pos.set(0, 0, 0);
  dir.set(range(rng, -0.07, 0.07), 1, range(rng, -0.07, 0.07)).normalize();

  recurse(pos, dir, p.trunkHeight, p.trunkRadius, 0, 0);

  return { branches, leaves };
}
