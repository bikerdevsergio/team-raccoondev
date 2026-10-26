// Genera sprite sheets de mapache (256x256, grilla 4x4 de frames 64x64:
// fila 0=abajo, 1=arriba, 2=izquierda, 3=derecha) sin depender de ningún
// servicio de IA externo — todo dibujado por código a nivel de píxel.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "../public/sprites");
const GRID = 32; // resolución lógica por frame, se escala x2 a 64x64
const SCALE = 2;
const FRAME = GRID * SCALE;
const SHEET = FRAME * 4;

const AGENTS = [
  { id: "dante", accent: [255, 63, 160] },
  { id: "midas", accent: [243, 217, 120] },
  { id: "volt", accent: [57, 230, 255] },
  { id: "themis", accent: [179, 136, 255] },
  { id: "hermes", accent: [255, 122, 89] },
];

const BODY = [150, 148, 162];
const BODY_SHADOW = [112, 110, 124];
const MASK = [40, 38, 52];
const MUZZLE = [226, 223, 232];
const NOSE = [30, 28, 38];
const TAIL_LIGHT = [196, 193, 206];

function inEllipse(x, y, cx, cy, rx, ry) {
  const dx = (x - cx) / rx;
  const dy = (y - cy) / ry;
  return dx * dx + dy * dy <= 1;
}

function inTriangle(x, y, [ax, ay], [bx, by], [cx, cy]) {
  const d = (x1, y1, x2, y2, x3, y3) => (x1 - x3) * (y2 - y3) - (x2 - x3) * (y1 - y3);
  const d1 = d(x, y, ax, ay, bx, by);
  const d2 = d(x, y, bx, by, cx, cy);
  const d3 = d(x, y, cx, cy, ax, ay);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

/** Dibuja un frame de 32x32 según dirección ('down'|'up'|'left'|'right') y offset de paso (-1,0,1). */
function drawFrame(direction, legOffset, accent) {
  const px = new Array(GRID * GRID).fill(null);
  const set = (x, y, color) => {
    if (x >= 0 && x < GRID && y >= 0 && y < GRID) px[y * GRID + x] = color;
  };

  const cx = 16;
  const earY = 11;
  const headCy = 15;
  const bodyCy = 23;
  const sideFlip = direction === "left" ? -1 : 1;
  const isSide = direction === "left" || direction === "right";
  const earDx = isSide ? 2.2 * sideFlip : 4.5;
  const HEAD_RX = 5.6, HEAD_RY = 5.2;
  const BODY_RX = 6, BODY_RY = 6.5;

  // cola (detrás del cuerpo): franjas claro/oscuro alternadas, estilo mapache
  if (direction === "up") {
    for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
      if (inEllipse(x, y, cx, bodyCy + 7.5, 3.4, 5.2)) set(x, y, (y - (bodyCy + 3)) % 3 < 1.5 ? BODY_SHADOW : TAIL_LIGHT);
    }
  }
  if (isSide) {
    const tx = cx + 5.2 * sideFlip;
    for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
      if (inEllipse(x, y, tx, bodyCy + 2.2, 2.6, 6)) set(x, y, (y - bodyCy) % 3 < 1.5 ? BODY_SHADOW : TAIL_LIGHT);
    }
  }

  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      // cuerpo
      if (inEllipse(x, y, cx, bodyCy, BODY_RX, BODY_RY)) set(x, y, BODY);
      // cabeza
      if (inEllipse(x, y, cx, headCy, HEAD_RX, HEAD_RY)) set(x, y, BODY);
      // orejas (dos triángulos, en vista lateral se solapan -> una visible)
      if (inTriangle(x, y, [cx - earDx - 2.2, earY + 3], [cx - earDx, earY - 3], [cx - earDx + 2.2, earY + 3])) set(x, y, BODY_SHADOW);
      if (!isSide && inTriangle(x, y, [cx + earDx - 2.2, earY + 3], [cx + earDx, earY - 3], [cx + earDx + 2.2, earY + 3])) set(x, y, BODY_SHADOW);
    }
  }

  // antifaz + hocico + ojos (de frente) / nuca lisa (de espaldas) / perfil (costado)
  if (direction === "down") {
    for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
      if (inEllipse(x, y, cx, headCy + 0.8, 5.2, 2.7)) set(x, y, MASK);
      if (inEllipse(x, y, cx, headCy + 3, 3, 2.3)) set(x, y, MUZZLE);
    }
    set(cx, headCy + 3, NOSE);
    set(Math.round(cx - 2.6), headCy, accent); set(Math.round(cx - 2.2), headCy, accent);
    set(Math.round(cx + 2.2), headCy, accent); set(Math.round(cx + 2.6), headCy, accent);
  } else if (direction === "up") {
    for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
      if (inEllipse(x, y, cx, headCy - 2.2, 4.4, 3)) set(x, y, BODY_SHADOW);
    }
  } else {
    const ox = 3 * sideFlip;
    for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
      if (inEllipse(x, y, cx + ox, headCy + 0.8, 3.3, 2.7)) set(x, y, MASK);
      if (inEllipse(x, y, cx + ox + 1.5 * sideFlip, headCy + 2.2, 2.2, 1.9)) set(x, y, MUZZLE);
    }
    set(Math.round(cx + ox + 1.5 * sideFlip), headCy + 2.2, NOSE);
    set(Math.round(cx + ox * 1.3), headCy, accent);
  }

  // collar / banda de acento
  for (let x = Math.round(cx - BODY_RX); x <= Math.round(cx + BODY_RX); x++) set(x, Math.round(bodyCy - 5), accent);

  // patas (alternan con el ciclo de caminata)
  const footY = Math.round(bodyCy + BODY_RY - 1);
  const spread = 3.6;
  set(Math.round(cx - spread + legOffset), footY, BODY_SHADOW); set(Math.round(cx - spread + legOffset), footY - 1, BODY_SHADOW);
  set(Math.round(cx + spread - legOffset), footY, BODY_SHADOW); set(Math.round(cx + spread - legOffset), footY - 1, BODY_SHADOW);

  return px;
}

async function buildSheet(agentId, accent) {
  const directions = ["down", "up", "left", "right"];
  const legCycle = [0, 1, 0, -1]; // 4 frames de ciclo de caminata por fila

  const composites = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const px = drawFrame(directions[row], legCycle[col], accent);
      const raw = Buffer.alloc(GRID * GRID * 4);
      for (let i = 0; i < GRID * GRID; i++) {
        const c = px[i];
        if (c) {
          raw[i * 4] = c[0]; raw[i * 4 + 1] = c[1]; raw[i * 4 + 2] = c[2]; raw[i * 4 + 3] = 255;
        }
      }
      const frameBuf = await sharp(raw, { raw: { width: GRID, height: GRID, channels: 4 } })
        .resize(FRAME, FRAME, { kernel: "nearest" })
        .png()
        .toBuffer();
      composites.push({ input: frameBuf, left: col * FRAME, top: row * FRAME });
    }
  }

  const sheet = sharp({
    create: { width: SHEET, height: SHEET, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).composite(composites);

  await mkdir(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, `${agentId}_walk.png`);
  await sheet.png().toFile(outPath);
  console.log("generado:", outPath);
}

for (const agent of AGENTS) {
  await buildSheet(agent.id, agent.accent);
}
