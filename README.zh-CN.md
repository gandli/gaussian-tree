# Gaussian Tree

[English](README.md) | 简体中文

在浏览器里用参数程序化生成一棵树，直接把它表示为 3D 高斯泼溅（3D Gaussian Splatting），通过 WebGPU 实时渲染，并导出为 `.spz` 文件。

## 工作原理

```
参数（种子、树干、分枝、叶片）
    │
    ▼
树骨架（Weber-Penn 递归分枝）
    │
    ▼
Gaussian Builder（枝 → 拉长高斯椭球，叶 → 扁平圆盘高斯）
    │
    ▼
spark SplatMesh（Three.js + WebGPU 3DGS 渲染器）
    │
    ▼
交互式 3D 视图 + .spz 导出
```

**没有中间 mesh。** 树骨架本身就是高斯的来源——枝是圆柱形高斯，叶是扁平圆盘高斯。这是核心洞察：完全跳过 mesh 层。

## 快速开始

```bash
npm install
npm run dev      # http://localhost:5390
```

需要支持 WebGPU 的浏览器（Chrome 113+ / Edge），自动回退 WebGL2。

## 架构

| 层 | 文件 | 职责 |
|---|---|---|
| 类型 | `src/tree/types.ts` | `TreeParams`、`TreeSkeleton`、`Gaussian` 接口 + 默认参数 |
| 随机数 | `src/tree/rng.ts` | 可播种 PRNG（mulberry32），同种子复现同一棵树 |
| 生成器 | `src/tree/generator.ts` | 简化 Weber-Penn：递归分枝 + 黄金角展开 |
| 构建器 | `src/tree/gaussian-builder.ts` | 骨架 → `Gaussian[]`：枝=圆柱，叶=圆盘 |
| 入口 | `src/main.ts` | Three.js 场景 + spark 渲染器 + UI + SpzWriter 导出 |

## 技术栈

- **[spark](https://github.com/sparkjsdev/spark)**（MIT, 3.5k★）— Three.js 3D Gaussian Splatting 渲染器，WebGPU
- **[Three.js](https://threejs.org)** — 场景图、相机、控制
- **[Vite](https://vite.dev)** — 开发服务器 + 构建
- **TypeScript** — strict 模式

## 导出

点击 **Export .spz** 下载当前树的 `.spz` 文件（spark 原生格式），可在任何 spark viewer 或兼容 3DGS 工具中加载。

## 路线图

- [ ] 风吹动画（spark shader graph 顶点位移）
- [ ] LOD 链（近处全量高斯，远处 billboard）
- [ ] 更多树种（L-System 生成器，沙漠植物）
- [ ] glTF 导出
- [ ] 实时参数预览（防抖重生）

## 许可

MIT
