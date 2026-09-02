import * as THREE from "three";

/**
 * Draw a leaf sprite on canvas: pointed ellipse, central + side veins.
 * GRAYSCALE base — instanceColor multiplies it to per-leaf green variation.
 */
export function makeLeafTexture(size = 256): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const cx = size / 2;
  const top = size * 0.06;
  const bot = size * 0.94;
  const halfW = size * 0.3;

  ctx.clearRect(0, 0, size, size);

  // leaf outline: two bezier curves meeting at tip and base
  ctx.beginPath();
  ctx.moveTo(cx, bot);
  ctx.bezierCurveTo(cx - halfW, bot - size * 0.25, cx - halfW, top + size * 0.2, cx, top);
  ctx.bezierCurveTo(cx + halfW, top + size * 0.2, cx + halfW, bot - size * 0.25, cx, bot);
  ctx.closePath();

  // grayscale fill (brighter tip, darker base)
  const grad = ctx.createLinearGradient(0, bot, 0, top);
  grad.addColorStop(0, "#4a4a4a");
  grad.addColorStop(0.5, "#6e6e6e");
  grad.addColorStop(1, "#8e8e8e");
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.clip();

  // central vein
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = size * 0.014;
  ctx.beginPath();
  ctx.moveTo(cx, bot - size * 0.03);
  ctx.lineTo(cx, top + size * 0.02);
  ctx.stroke();

  // side veins
  ctx.lineWidth = size * 0.009;
  for (let i = 1; i <= 6; i++) {
    const y = bot - ((bot - top) / 7) * i;
    const spread = halfW * (1 - i / 9);
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.lineTo(cx - spread, y - size * 0.07);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.lineTo(cx + spread, y - size * 0.07);
    ctx.stroke();
  }

  // subtle noise for organic feel
  const imgData = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < imgData.data.length; i += 4) {
    if (imgData.data[i + 3] > 0) {
      const n = (Math.random() - 0.5) * 18;
      imgData.data[i] += n;
      imgData.data[i + 1] += n;
      imgData.data[i + 2] += n;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
