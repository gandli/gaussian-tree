export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Branch {
  start: Vec3;
  end: Vec3;
  startRadius: number;
  endRadius: number;
}

export interface Leaf {
  position: Vec3;
  /** unit normal of the leaf disc */
  normal: Vec3;
  size: number;
  /** linear RGB 0..1 */
  color: [number, number, number];
}

export interface TreeSkeleton {
  branches: Branch[];
  leaves: Leaf[];
}

/** A single 3D Gaussian primitive before it enters the renderer. */
export interface Gaussian {
  center: Vec3;
  /** half-extents along local x/y/z */
  scales: Vec3;
  /** orientation as quaternion (x,y,z,w) */
  quaternion: [number, number, number, number];
  opacity: number;
  color: [number, number, number];
}

export interface TreeParams {
  seed: number;
  trunkHeight: number;
  trunkRadius: number;
  /** recursion depth of the branch skeleton */
  levels: number;
  /** child branches spawned per parent at each level */
  branchesPerLevel: number;
  /** length of a child as a fraction of its parent */
  lengthFalloff: number;
  /** radius taper as a fraction of parent radius */
  radiusFalloff: number;
  /** angle (deg) between a child and its parent axis */
  branchAngle: number;
  /** downward bias (deg) pulling child toward gravity */
  downAngle: number;
  /** angular spread of children around the parent axis */
  spread: number;
  /** leaves per terminal branch tip */
  leavesPerTip: number;
  leafSize: number;
  /** bark linear RGB 0..1 */
  barkColor: [number, number, number];
  /** leaf linear RGB 0..1 */
  leafColor: [number, number, number];
}

export const DEFAULT_PARAMS: TreeParams = {
  seed: 1337,
  trunkHeight: 6,
  trunkRadius: 0.4,
  levels: 5,
  branchesPerLevel: 4,
  lengthFalloff: 0.7,
  radiusFalloff: 0.6,
  branchAngle: 35,
  downAngle: 15,
  spread: 137.5,
  leavesPerTip: 30,
  leafSize: 0.4,
  barkColor: [0.35, 0.28, 0.18],
  leafColor: [0.25, 0.5, 0.18],
};
