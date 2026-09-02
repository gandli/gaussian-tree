# Gaussian Tree

English | [简体中文](README.zh-CN.md)

Procedurally generate a tree in the browser, represent it directly as 3D Gaussian Splatting, render in real-time via WebGPU, and export to `.spz`.

## What it does

```
Parameters (seed, trunk, branches, leaves)
    │
    ▼
Tree Skeleton (Weber-Penn recursive branching)
    │
    ▼
Gaussian Builder (branches → elongated gaussians, leaves → flat disc gaussians)
    │
    ▼
spark SplatMesh (Three.js + WebGPU 3DGS renderer)
    │
    ▼
Interactive 3D view + .spz export
```

No mesh intermediate. The tree skeleton IS the gaussian source — branches are cylindrical gaussians, leaves are flat disc gaussians. This is the key insight: skip the mesh entirely.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5390
```

Requires a WebGPU-capable browser (Chrome 113+ / Edge). Falls back to WebGL2 automatically.

## Architecture

| Layer | File | Role |
|-------|------|------|
| Types | `src/tree/types.ts` | `TreeParams`, `TreeSkeleton`, `Gaussian` interfaces + defaults |
| RNG | `src/tree/rng.ts` | Seedable PRNG (mulberry32) for reproducible trees |
| Generator | `src/tree/generator.ts` | Simplified Weber-Penn: recursive branching with golden-angle spread |
| Builder | `src/tree/gaussian-builder.ts` | Skeleton → `Gaussian[]`: branches as cylinders, leaves as discs |
| Entry | `src/main.ts` | Three.js scene + spark renderer + UI + SpzWriter export |

## Tech stack

- **[spark](https://github.com/sparkjsdev/spark)** (MIT, 3.5k★) — Three.js 3D Gaussian Splatting renderer, WebGPU
- **[Three.js](https://threejs.org)** — scene graph, camera, controls
- **[Vite](https://vite.dev)** — dev server + build
- **TypeScript** — strict mode

## Export

Click **Export .spz** to download the current tree as a `.spz` file (spark native format). Loadable in any spark viewer or compatible 3DGS tool.

## Roadmap

- [ ] Wind animation (vertex displacement in spark shader graph)
- [ ] LOD chain (full gaussians near, billboard far)
- [ ] More species (L-System generator for desert plants)
- [ ] glTF export alongside .spz
- [ ] Real-time parameter preview (debounced regeneration)

## License

MIT
