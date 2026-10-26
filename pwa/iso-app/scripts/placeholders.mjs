// Placeholders mínimos solo para probar que traviso.js + pixi.js v7 levantan
// bien en nuestro entorno. Se reemplazan por los tiles reales de Kenney y los
// sprites de personaje generados con Gemini en el siguiente paso.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../public/assets");
await mkdir(OUT, { recursive: true });

async function diamondTile(name, color) {
  // tile isométrico clásico: rombo de 128x64
  const w = 128, h = 64;
  const raw = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = Math.abs(x - w / 2) / (w / 2);
      const ny = Math.abs(y - h / 2) / (h / 2);
      const i = (y * w + x) * 4;
      if (nx + ny <= 1) {
        raw[i] = color[0]; raw[i + 1] = color[1]; raw[i + 2] = color[2]; raw[i + 3] = 255;
      }
    }
  }
  await sharp(raw, { raw: { width: w, height: h, channels: 4 } }).png().toFile(path.join(OUT, name));
}

async function blob(name, color, w, h) {
  const raw = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    raw[i] = color[0]; raw[i + 1] = color[1]; raw[i + 2] = color[2]; raw[i + 3] = 255;
  }
  await sharp(raw, { raw: { width: w, height: h, channels: 4 } }).png().toFile(path.join(OUT, name));
}

await diamondTile("t_floor.png", [40, 42, 60]);
await blob("o_desk.png", [120, 90, 60], 100, 70);
await blob("hero_stand_se_0001.png", [255, 63, 160], 60, 90);

console.log("placeholders listos en", OUT);
