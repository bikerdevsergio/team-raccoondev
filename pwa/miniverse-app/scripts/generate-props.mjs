// Genera tiles de pared (de color), pavimento de estacionamiento, cordón,
// y una moto top-down por agente (tinte según su color de acento).
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "../public/tiles");
const SIZE = 32;

const AGENTS = [
  { id: "dante", accent: [255, 63, 160] },
  { id: "midas", accent: [243, 217, 120] },
  { id: "volt", accent: [57, 230, 255] },
  { id: "themis", accent: [179, 136, 255] },
  { id: "hermes", accent: [255, 122, 89] },
];

function makeRaw() {
  return Buffer.alloc(SIZE * SIZE * 4);
}
function setPx(raw, x, y, [r, g, b], a = 255) {
  if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return;
  const i = (y * SIZE + x) * 4;
  raw[i] = r; raw[i + 1] = g; raw[i + 2] = b; raw[i + 3] = a;
}
async function save(raw, name) {
  await mkdir(OUT_DIR, { recursive: true });
  await sharp(raw, { raw: { width: SIZE, height: SIZE, channels: 4 } }).png().toFile(path.join(OUT_DIR, name));
  console.log("tile generado:", name);
}

// Pared de color (violeta oscuro saturado, con una franja superior más clara tipo zócalo)
async function wallTile() {
  const raw = makeRaw();
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const stripe = y < 6;
    setPx(raw, x, y, stripe ? [120, 70, 170] : [58, 32, 92]);
  }
  await save(raw, "wall.png");
}

// Pavimento de estacionamiento (asfalto)
async function pavementTile() {
  const raw = makeRaw();
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const speck = (x * 7 + y * 13) % 23 === 0;
    setPx(raw, x, y, speck ? [46, 46, 54] : [38, 38, 46]);
  }
  await save(raw, "pavement.png");
}

// Línea de cordón (borde pintado, separa vereda/estacionamiento)
async function curbTile() {
  const raw = makeRaw();
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    setPx(raw, x, y, [38, 38, 46]);
  }
  for (let x = 0; x < SIZE; x += 6) {
    for (let dx = 0; dx < 3; dx++) setPx(raw, x + dx, 14, [224, 224, 232]);
    for (let dx = 0; dx < 3; dx++) setPx(raw, x + dx, 15, [224, 224, 232]);
  }
  await save(raw, "curb.png");
}

// Moto top-down vista desde arriba, tintada por acento
async function motoTile(id, accent) {
  const raw = makeRaw();
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    setPx(raw, x, y, [38, 38, 46]); // asfalto de fondo
  }
  const cx = 16;
  const dark = [22, 22, 28];
  // ruedas
  for (let y = 4; y < 10; y++) for (let x = cx - 3; x < cx + 3; x++) setPx(raw, x, y, dark);
  for (let y = 22; y < 28; y++) for (let x = cx - 3; x < cx + 3; x++) setPx(raw, x, y, dark);
  // cuerpo / tanque
  for (let y = 9; y < 15; y++) for (let x = cx - 4; x < cx + 4; x++) setPx(raw, x, y, accent);
  for (let y = 15; y < 22; y++) for (let x = cx - 2; x < cx + 2; x++) setPx(raw, x, y, [60, 60, 70]);
  // manubrio
  for (let x = cx - 6; x < cx + 6; x++) setPx(raw, x, 6, dark);
  await save(raw, `moto_${id}.png`);
}

// Moto del CEO (placeholder café racer negro/cuero/dorado — a reemplazar
// por el archivo real apenas lo pase el CEO).
async function ceoMotoTile() {
  const raw = makeRaw();
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) setPx(raw, x, y, [38, 38, 46]);
  const cx = 16;
  const BLACK = [18, 18, 23];
  const LEATHER = [74, 48, 36];
  const GOLD = [196, 150, 60];
  for (let y = 4; y < 10; y++) for (let x = cx - 3; x < cx + 3; x++) setPx(raw, x, y, BLACK);
  for (let y = 22; y < 28; y++) for (let x = cx - 3; x < cx + 3; x++) setPx(raw, x, y, BLACK);
  for (let y = 9; y < 14; y++) for (let x = cx - 4; x < cx + 4; x++) setPx(raw, x, y, BLACK); // tanque
  for (let y = 14; y < 20; y++) for (let x = cx - 2; x < cx + 2; x++) setPx(raw, x, y, LEATHER); // asiento
  for (let y = 10; y < 22; y++) { setPx(raw, cx - 4, y, GOLD); setPx(raw, cx + 3, y, GOLD); } // horquillas doradas
  for (let x = cx - 6; x < cx + 6; x++) setPx(raw, x, 6, BLACK);
  await save(raw, "moto_ceo.png");
}

await wallTile();
await pavementTile();
await curbTile();
for (const a of AGENTS) await motoTile(a.id, a.accent);
await ceoMotoTile();
