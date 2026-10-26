// Genera un tile de piso simple (32x32) para la escena — sin dependencias
// de arte externo, un tono oscuro con una leve grilla tipo "piso técnico".
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "../public/tiles");
const SIZE = 32;

async function floorTile() {
  const raw = Buffer.alloc(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = (y * SIZE + x) * 4;
      const edge = x === 0 || y === 0;
      const [r, g, b] = edge ? [36, 39, 58] : [26, 28, 43];
      raw[i] = r; raw[i + 1] = g; raw[i + 2] = b; raw[i + 3] = 255;
    }
  }
  await mkdir(OUT_DIR, { recursive: true });
  await sharp(raw, { raw: { width: SIZE, height: SIZE, channels: 4 } })
    .png()
    .toFile(path.join(OUT_DIR, "floor.png"));
}

await floorTile();
console.log("tile de piso generado en", OUT_DIR);
