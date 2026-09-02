import * as THREE from "three";
import type { TreeSkeleton, Gaussian } from "./types";

const _q = new THREE.Quaternion();
const _dir = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _quatArr: [number, number, number, number] = [0, 0, 0, 1];

/**
 * Convert a TreeSkeleton into an array of Gaussian primitives.
 *
 * Branches → elongated cylinders (scale.x ≈ scale.z ≈ radius, scale.y ≈ half-length).
 * Leaves   → flat discs (scale.x ≈ scale.z ≈ size, scale.y ≈ thin).
 */
export function buildGaussians(skeleton: TreeSkeleton): Gaussian[] {
  const gs: Gaussian[] = [];

  // --- branches ---
  for (const b of skeleton.branches) {
    const sx = b.start;
    const ex = b.end;
    const cx = (sx.x + ex.x) / 2;
    const cy = (sx.y + ex.y) / 2;
    const cz = (sx.z + ex.z) / 2;

    _dir.set(ex.x - sx.x, ex.y - sx.y, ex.z - sx.z);
    const len = _dir.length();
    if (len < 1e-6) continue;
    _dir.divideScalar(len);

    // quaternion that rotates +Y to branch direction
    _q.setFromUnitVectors(_up, _dir);
    _quatArr[0] = _q.x;
    _quatArr[1] = _q.y;
    _quatArr[2] = _q.z;
    _quatArr[3] = _q.w;

    const avgR = (b.startRadius + b.endRadius) / 2;

    gs.push({
      center: { x: cx, y: cy, z: cz },
      scales: { x: avgR, y: len / 2, z: avgR },
      quaternion: [..._quatArr],
      opacity: 1,
      color: [0.32, 0.24, 0.16], // bark
    });
  }

  // --- leaves ---
  for (const lf of skeleton.leaves) {
    _dir.set(lf.normal.x, lf.normal.y, lf.normal.z);
    if (_dir.lengthSq() < 1e-6) _dir.set(0, 1, 0);
    _dir.normalize();

    _q.setFromUnitVectors(_up, _dir);
    _quatArr[0] = _q.x;
    _quatArr[1] = _q.y;
    _quatArr[2] = _q.z;
    _quatArr[3] = _q.w;

    const s = lf.size;
    gs.push({
      center: lf.position,
      scales: { x: s, y: s * 0.05, z: s }, // flat disc
      quaternion: [..._quatArr],
      opacity: 0.85,
      color: lf.color,
    });
  }

  return gs;
}
