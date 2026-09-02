import * as THREE from "three";
import type { TreeSkeleton } from "./types";
import { makeBarkTexture, makeBarkNormal } from "./bark-texture";

/**
 * Build a Three.js mesh for the trunk + thick branches using tapered
 * cylinders merged into one geometry. Real bark texture + normals →
 * reads as wood, not gaussian blur.
 */
export function buildWoodMesh(skeleton: TreeSkeleton): THREE.Mesh {
  const geoms: THREE.BufferGeometry[] = [];

  const dir = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const quat = new THREE.Quaternion();

  // all branches (including thin twigs) → connected wood, leaves attach to real twigs
  for (const b of skeleton.branches) {
    dir.set(b.end.x - b.start.x, b.end.y - b.start.y, b.end.z - b.start.z);
    const len = dir.length();
    if (len < 1e-6) continue;
    dir.normalize();
    quat.setFromUnitVectors(up, dir);

    const rad = Math.max(b.startRadius, 0.015); // floor so twigs aren't invisible
    const cyl = new THREE.CylinderGeometry(Math.max(b.endRadius, 0.012), rad, 1, 6, 1, false);
    // order matters: pivot base → stretch along local Y → rotate to dir → move to start
    cyl.translate(0, 0.5, 0);
    cyl.scale(1, len, 1);
    cyl.applyQuaternion(quat);
    cyl.translate(b.start.x, b.start.y, b.start.z);

    geoms.push(cyl);
  }

  // root flare: cone at trunk base (branches[0] is the trunk)
  const trunk = skeleton.branches[0];
  if (trunk) {
    const flareH = trunk.startRadius * 3.5;
    const flare = new THREE.ConeGeometry(trunk.startRadius * 2.2, flareH, 10, 1, true);
    flare.translate(0, flareH / 2, 0);
    flare.translate(trunk.start.x, trunk.start.y, trunk.start.z);
    geoms.push(flare);
  }

  const merged = mergeGeometries(geoms);
  const mat = new THREE.MeshStandardMaterial({
    map: makeBarkTexture(),
    normalMap: makeBarkNormal(),
    normalScale: new THREE.Vector2(2.5, 2.5),
    roughness: 0.85,
    metalness: 0,
  });
  const mesh = new THREE.Mesh(merged, mat);
  mesh.castShadow = true;
  return mesh;
}

/** Minimal BufferGeometry merge (position + normal + uv) without extra deps. */
function mergeGeometries(geoms: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const out = new THREE.BufferGeometry();
  if (geoms.length === 0) return out;

  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  let base = 0;

  for (const g of geoms) {
    const p = g.getAttribute("position");
    const n = g.getAttribute("normal");
    const u = g.getAttribute("uv");
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i));
      nor.push(n.getX(i), n.getY(i), n.getZ(i));
      if (u) uv.push(u.getX(i), u.getY(i));
    }
    const gi = g.getIndex();
    if (gi) for (let i = 0; i < gi.count; i++) idx.push(gi.getX(i) + base);
    base += p.count;
    g.dispose();
  }

  out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  out.setIndex(idx);
  return out;
}
