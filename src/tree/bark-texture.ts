import * as THREE from "three";

/**
 * Procedural bark texture: WIDE high-contrast vertical bands.
 * Stripes must be ~5% of texture width to survive trunk-scale UV compression.
 */
export function makeBarkTexture(size = 512): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // dark base
  ctx.fillStyle = "#241a10";
  ctx.fillRect(0, 0, size, size);

  // wide vertical ridges (bright) vs crevices (dark), ~25px bands
  const band = 26;
  for (let x = 0; x < size; x += band) {
    const w = band * (0.5 + Math.random() * 0.4);
    const bright = 0.55 + Math.random() * 0.5;
    const r = Math.round(175 * bright);
    const g = Math.round(125 * bright);
    const b = Math.round(75 * bright);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(x, 0, w, size);
    // ridge edge highlight
    ctx.fillStyle = `rgba(255,220,170,0.18)`;
    ctx.fillRect(x + w * 0.3, 0, 3, size);
  }

  // horizontal cracks cutting across ridges
  for (let i = 0; i < 26; i++) {
    const y = Math.random() * size;
    const x = Math.random() * size * 0.3;
    const w = size * 0.2 + Math.random() * size * 0.5;
    ctx.fillStyle = `rgba(6,4,2,${0.55 + Math.random() * 0.35})`;
    ctx.fillRect(x, y, w, 3 + Math.random() * 5);
  }

  // noise speckle
  const imgData = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 26;
    imgData.data[i] += n;
    imgData.data[i + 1] += n;
    imgData.data[i + 2] += n;
  }
  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 2); // coarse: one tile spans half the trunk height
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Bark normal map matching the wide-band grain.
 */
export function makeBarkNormal(size = 256): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "rgb(128,128,255)";
  ctx.fillRect(0, 0, size, size);

  // wide ridge normals: left half tilts one way, right half the other
  const band = 13;
  for (let x = 0; x < size; x += band) {
    ctx.fillStyle = "rgb(60,128,255)";
    ctx.fillRect(x, 0, band / 2, size);
    ctx.fillStyle = "rgb(196,128,255)";
    ctx.fillRect(x + band / 2, 0, band / 2, size);
  }

  // crack normals
  for (let i = 0; i < 20; i++) {
    const y = Math.random() * size;
    ctx.fillStyle = "rgb(128,40,255)";
    ctx.fillRect(0, y, size, 2 + Math.random() * 3);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 2);
  return tex;
}
