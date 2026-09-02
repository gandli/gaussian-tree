import * as THREE from "three";
import {
  SparkRenderer,
  SparkControls,
  SplatMesh,
  SpzWriter,
} from "@sparkjsdev/spark";
import { generateTree } from "./tree/generator";
import { buildGaussians } from "./tree/gaussian-builder";
import { DEFAULT_PARAMS, type TreeParams } from "./tree/types";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1c20);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.01, 1000);
camera.position.set(9, 6, 12);
camera.lookAt(0, 3.5, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

const spark = new SparkRenderer({ renderer });
scene.add(spark);

// ground grid for spatial reference
const grid = new THREE.GridHelper(20, 20, 0x3a3f46, 0x2a2e35);
grid.position.y = -0.01;
scene.add(grid);

const controls = new SparkControls({ canvas: renderer.domElement });

let treeMesh: SplatMesh | null = null;

function readParams(): TreeParams {
  const g = (id: string) => document.getElementById(id) as HTMLInputElement;
  return {
    seed: Number(g("seed").value) || 0,
    trunkHeight: Number(g("trunkHeight").value),
    trunkRadius: Number(g("trunkRadius").value),
    levels: Number(g("levels").value),
    branchesPerLevel: Number(g("branchesPerLevel").value),
    lengthFalloff: 0.72,
    radiusFalloff: 0.62,
    branchAngle: Number(g("branchAngle").value),
    downAngle: Number(g("downAngle").value),
    spread: 137.5,
    leavesPerTip: Number(g("leavesPerTip").value),
    leafSize: 0.45,
    barkColor: DEFAULT_PARAMS.barkColor,
    leafColor: DEFAULT_PARAMS.leafColor,
  };
}

function regenerate() {
  const params = readParams();
  const skeleton = generateTree(params);
  const gaussians = buildGaussians(skeleton);

  const mesh = new SplatMesh({
    constructSplats: (splats) => {
      splats.ensureSplats(gaussians.length);
      for (const g of gaussians) {
        splats.pushSplat(
          new THREE.Vector3(g.center.x, g.center.y, g.center.z),
          new THREE.Vector3(g.scales.x, g.scales.y, g.scales.z),
          new THREE.Quaternion(g.quaternion[0], g.quaternion[1], g.quaternion[2], g.quaternion[3]),
          g.opacity,
          new THREE.Color(g.color[0], g.color[1], g.color[2]),
        );
      }
    },
  });

  if (treeMesh) {
    scene.remove(treeMesh);
    treeMesh.dispose();
  }
  scene.add(mesh);
  treeMesh = mesh;

  document.getElementById("stats")!.textContent =
    `${gaussians.length.toLocaleString()} gaussians (${skeleton.branches.length} branches, ${skeleton.leaves.length} leaves)`;
}

function exportSpz() {
  const params = readParams();
  const skeleton = generateTree(params);
  const gaussians = buildGaussians(skeleton);

  const writer = new SpzWriter({
    numSplats: gaussians.length,
    shDegree: 0,
    fractionalBits: 12,
  });
  for (let i = 0; i < gaussians.length; i++) {
    const g = gaussians[i];
    writer.setCenter(i, g.center.x, g.center.y, g.center.z);
    writer.setScale(i, g.scales.x, g.scales.y, g.scales.z);
    writer.setAlpha(i, g.opacity);
    writer.setRgb(i, g.color[0], g.color[1], g.color[2]);
    writer.setQuat(i, g.quaternion[0], g.quaternion[1], g.quaternion[2], g.quaternion[3]);
  }
  writer.finalize().then((fileBytes) => {
    const out = new Uint8Array(fileBytes); // ensure ArrayBuffer-backed view for Blob
    const blob = new Blob([out], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gaussian-tree-${(document.getElementById("seed") as HTMLInputElement).value}.spz`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

// bind UI sliders (regenerate is manual via button)
for (const id of ["trunkHeight", "trunkRadius", "levels", "branchesPerLevel", "branchAngle", "downAngle", "leavesPerTip"]) {
  const el = document.getElementById(id) as HTMLInputElement;
  el.addEventListener("input", () => {
    document.getElementById(`${id}V`)!.textContent = el.value;
  });
}

document.getElementById("regenerate")!.addEventListener("click", regenerate);
document.getElementById("export")!.addEventListener("click", exportSpz);

regenerate();

renderer.setAnimationLoop(() => {
  controls.update(camera);
  renderer.render(scene, camera);
});

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
