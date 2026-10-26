// Procesa un sprite sheet de personaje generado con Gemini (grilla 4x2:
// columnas = se/sw/nw/ne, fila1 = parado, fila2 = caminando) y lo convierte
// en frames individuales con fondo transparente, listos para traviso.js.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const DIRECTIONS = ["se", "sw", "nw", "ne"]; // orden de columnas, izq a der
const ROWS = ["stand", "walk"];
const LABEL_KEEP_FRACTION = 0.8; // recorta el texto de la etiqueta abajo de cada celda
const BG_TOLERANCE = 28; // distancia de color para considerar "fondo"
const BG_FEATHER = 20; // banda de transición suave para evitar bordes dentados
const CELL_INSET = 16; // px a descartar de cada borde de celda (evita las líneas divisorias de la grilla)

function colorDistance(r, g, b, br, bg, bb) {
  const dr = r - br, dg = g - bg, db = b - bb;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

async function removeBackground(buffer, width, height, bg) {
  const raw = Buffer.from(buffer);
  for (let i = 0; i < width * height; i++) {
    const o = i * 4;
    const d = colorDistance(raw[o], raw[o + 1], raw[o + 2], bg[0], bg[1], bg[2]);
    if (d < BG_TOLERANCE) {
      raw[o + 3] = 0;
    } else if (d < BG_TOLERANCE + BG_FEATHER) {
      const t = (d - BG_TOLERANCE) / BG_FEATHER;
      raw[o + 3] = Math.round(raw[o + 3] * t);
    }
  }
  return raw;
}

/**
 * @param {string} inputPath ruta a la imagen fuente (sprite sheet de Gemini)
 * @param {string} characterId ej. "dante"
 * @param {string} outDir carpeta de salida para los frames procesados
 */
export async function processCharacterSheet(inputPath, characterId, outDir) {
  const source = sharp(inputPath);
  const meta = await source.metadata();
  const cellW = Math.floor(meta.width / DIRECTIONS.length);
  const cellH = Math.floor(meta.height / ROWS.length);
  const cropH = Math.floor(cellH * LABEL_KEEP_FRACTION);

  const { data: fullRaw } = await source.clone().raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const bg = [fullRaw[0], fullRaw[1], fullRaw[2]];

  await mkdir(outDir, { recursive: true });
  const results = [];

  for (let row = 0; row < ROWS.length; row++) {
    for (let col = 0; col < DIRECTIONS.length; col++) {
      const left = col * cellW + CELL_INSET;
      const top = row * cellH + CELL_INSET;

      const { data, info } = await sharp(inputPath)
        .extract({ left, top, width: cellW - CELL_INSET * 2, height: cropH - CELL_INSET })
        .raw()
        .ensureAlpha()
        .toBuffer({ resolveWithObject: true });

      const transparent = await removeBackground(data, info.width, info.height, bg);

      const outName = `${characterId}_${ROWS[row]}_${DIRECTIONS[col]}.png`;
      const outPath = path.join(outDir, outName);
      await sharp(transparent, { raw: { width: info.width, height: info.height, channels: 4 } })
        .trim()
        .png()
        .toFile(outPath);
      results.push(outPath);
    }
  }

  return results;
}

// Permite correrlo también desde línea de comandos:
// node process-character.mjs <inputPath> <characterId> <outDir>
if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , inputPath, characterId, outDir] = process.argv;
  const results = await processCharacterSheet(inputPath, characterId, outDir);
  console.log(results.join("\n"));
}
