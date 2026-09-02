import * as THREE from "three";
import type { TreeSkeleton, Gaussian, TreeParams } from "./types";
import { makeRng, range } from "./rng";

const _up = new THREE.Vector3(0, 1, 0);
const _q = new THREE.Quaternion();

/**
 * Convert a TreeSkeleton into Gaussian primitives.
 *
 * Branches: dense overlapping spheres sampled along the segment axis
 * (center + 6-point ring per station) → reads as a solid woody tube.
 * Leaves:   clusters of small flat discs with per-disc color jitter.
 *
 * ponytail: fixed 6-point ring + 4-disc cluster; expose density knobs if needed.
 */
export function buildGaussians(skeleton: TreeSkeleton, p: TreeParams): Gaussian[] {
  const rng = makeRng((p.seed ^ 0x9e3779b9) >>> 0);
  const gs: Gaussian[] = [];

  const start = new THREE.Vector3();
  const end = new THREE.Vector3();
  const axis = new THREE.Vector3();
  const u = new THREE.Vector3();
  const v = new THREE.Vector3();
  const center = new THREE.Vector3();
  const pos = new THREE.Vector3();

  for (const b of skeleton.branches) {
    start.set(b.start.x, b.start.y, b.start.z);
    end.set(b.end.x, b.end.y, b.end.z);
    axis.copy(end).sub(start);
    const len = axis.length();
    if (len < 1e-6) continue;
    axis.divideScalar(len);

    // orthonormal frame around the branch axis
    if (Math.abs(axis.y) < 0.9) u.crossVectors(axis, _up);
    else u.set(1, 0, 0);
    u.normalize();
    v.crossVectors(axis, u).normalize();

    const avgR = (b.startRadius + b.endRadius) / 2;
    const rings = Math.max(1, Math.round(len / Math.max(avgR * 0.7, 1e-3)));

    for (let i = 0; i <= rings; i++) {
      const t = i / rings;
      const r = b.startRadius + (b.endRadius - b.startRadius) * t;
      center.copy(start).lerp(end, t);
      const s = r * 0.9;
      const shade = range(rng, 0.8, 1.2);
      const color: [number, number, number] = [
        p.barkColor[0] * shade,
        p.barkColor[1] * shade,
        p.barkColor[2] * shade,
      ];

      gs.push({
        center: { x: center.x, y: center.y, z: center.z },
        scales: { x: s, y: s, z: s },
        quaternion: [0, 0, 0, 1],
        opacity: 1,
        color,
      });

      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2 + t * 4;
        pos
          .copy(u)
          .multiplyScalar(Math.cos(a) * r * 0.8)
          .addScaledVector(v, Math.sin(a) * r * 0.8)
          .add(center);
        gs.push({
          center: { x: pos.x, y: pos.y, z: pos.z },
          scales: { x: s, y: s, z: s },
          quaternion: [0, 0, 0, 1],
          opacity: 1,
          color,
        });
      }
    }
  }

  for (const lf of skeleton.leaves) {
    _q.setFromUnitVectors(_up, pos.set(lf.normal.x, lf.normal.y, lf.normal.z).normalize());
    const quat: [number, number, number, number] = [_q.x, _q.y, _q.z, _q.w];

    // canopy shading: darker lower (under-lit), lighter upper (sun-lit)
    const heightShade = 0.7 + Math.min(1, Math.max(0, (lf.position.y - 1) / 10)) * 0.5;

    for (let k = 0; k < 4; k++) {
      const s = lf.size * range(rng, 0.45, 0.7); // smaller discs → leaf detail, less cotton
      const shade = range(rng, 0.85, 1.1) * heightShade;
      gs.push({
        center: {
          x: lf.position.x + range(rng, -0.1, 0.1) * lf.size,
          y: lf.position.y + range(rng, -0.1, 0.1) * lf.size,
          z: lf.position.z + range(rng, -0.1, 0.1) * lf.size,
        },
        scales: { x: s, y: s * 0.03, z: s }, // flat disc
        quaternion: quat,
        opacity: 1,
        color: [lf.color[0] * shade, lf.color[1] * shade, lf.color[2] * shade],
      });
    }
  }

  return gs;
}
