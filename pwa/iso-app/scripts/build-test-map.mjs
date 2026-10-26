// Genera mapData.json + la lista de assetsToLoad para probar los 6
// personajes reales juntos en una grilla de prueba.
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const CHARACTERS = ["dante", "midas", "volt", "themis", "hermes", "ceo"];
const DIRECTIONS = ["se", "sw", "nw", "ne"];
const COLS = 8;
const ROWS = 4;

const objects = {
  "1": {
    movable: false, interactive: false, rowSpan: 1, columnSpan: 1, noTransparency: false, floor: false,
    visuals: { idle: { frames: [{ path: "assets/o_desk.png" }] } },
  },
};

const assetsToLoad = ["assets/t_floor.png", "assets/o_desk.png", "assets/tileHighlight.png"];

CHARACTERS.forEach((id, i) => {
  const objId = String(i + 2);
  const visuals = {};
  for (const dir of DIRECTIONS) {
    const standPath = `assets/characters/${id}/${id}_stand_${dir}.png`;
    const walkPath = `assets/characters/${id}/${id}_walk_${dir}.png`;
    visuals[`idle_${dir}`] = { frames: [{ path: standPath }] };
    visuals[`move_${dir}`] = { frames: [{ path: walkPath }] };
    assetsToLoad.push(standPath, walkPath);
  }
  visuals.idle = visuals.idle_se;
  objects[objId] = {
    movable: true, interactive: true, rowSpan: 1, columnSpan: 1, noTransparency: true, floor: false,
    visuals,
  };
});

const objectsMapRows = Array.from({ length: ROWS }, (_, r) => {
  const cells = Array.from({ length: COLS }, () => 0);
  if (r === 1) cells[0] = 1; // escritorio placeholder
  if (r === 2) {
    CHARACTERS.forEach((_, i) => { cells[i + 1] = i + 2; });
  }
  return { row: cells.join(",") };
});

const groundMapRows = Array.from({ length: ROWS }, () => ({ row: Array.from({ length: COLS }, () => 1).join(",") }));

const mapData = {
  tiles: { "1": { movable: true, path: "assets/t_floor.png" } },
  objects,
  initialControllableLocation: { columnIndex: 1, rowIndex: 2, controllableId: "2" },
  tileHighlightImage: { path: "assets/tileHighlight.png" },
  groundMap: groundMapRows,
  objectsMap: objectsMapRows,
};

await writeFile(path.join(ROOT, "../public/mapData.json"), JSON.stringify(mapData, null, 2));

const indexHtml = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>RaccoonDev HQ — prueba isométrica (6 personajes)</title>
<style>
  body { margin: 0; background: #0b0c14; }
</style>
<script src="/vendor/pixi.min.js"></script>
<script src="/vendor/traviso.min.js"></script>
</head>
<body>
<script>
  const pixiRoot = new PIXI.Application({ width: 1200, height: 700, backgroundColor: 0x0b0c14 });
  document.body.appendChild(pixiRoot.view);

  const instanceConfig = {
    mapDataPath: "mapData.json",
    assetsToLoad: ${JSON.stringify(assetsToLoad, null, 2)},
  };

  const engine = TRAVISO.getEngineInstance(instanceConfig);
  pixiRoot.stage.addChild(engine);
</script>
</body>
</html>
`;
await writeFile(path.join(ROOT, "../public/index.html"), indexHtml);

console.log("mapData.json e index.html generados con", CHARACTERS.length, "personajes.");
