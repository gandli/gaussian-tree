import * as THREE from "three";
import type { TreeSkeleton } from "./types";
import { makeLeafTexture } from "./leaf-texture";

/**
 * Build leaves as a single InstancedMesh of leaf cards (quads with a
 * realistic leaf alpha texture). Cards face their leaf normal with a
 * random roll; grayscale texture × instanceColor gives per-leaf variation.
 */
export function buildFoliage(skeleton: TreeSkeleton): THREE.InstancedMesh {
  const tex = makeLeafTexture();
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.3,
    side: THREE.DoubleSide,
    roughness: 0.9,
    metalness: 0,
  });

  const quad = new THREE.PlaneGeometry(1, 1);
  const mesh = new THREE.InstancedMesh(quad, mat, skeleton.leaves.length);

  const up = new THREE.Vector3(0, 0, 1); // plane normal is +Z
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const color = new THREE.Color();
  const m = new THREE.Matrix4();

  skeleton.leaves.forEach((lf, i) => {
    pos.set(lf.position.x, lf.position.y, lf.position.z);
    // world-space random orientation: leaf faces a random direction, not always branch-normal
    const dir = new THREE.Vector3(lf.normal.x, lf.normal.y, lf.normal.z).normalize();
    quat.setFromUnitVectors(up, dir);
    const roll = new THREE.Quaternion();
    roll.setFromAxisAngle(dir, Math.random() * Math.PI * 2);
    quat.multiply(roll);
    // random tilt so cards fill volume, not all parallel
    const tilt = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      (Math.random() - 0.5) * 1.2,
    );
    quat.multiply(tilt);
    scale.setScalar(lf.size * 1.6);
    m.compose(pos, quat, scale);
    mesh.setMatrixAt(i, m);
    color.setRGB(lf.color[0], lf.color[1], lf.color[2]);
    mesh.setColorAt(i, color);
  });

  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.castShadow = true;
  return mesh;
}
