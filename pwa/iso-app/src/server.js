import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../");
const app = express();

app.use(express.static(path.join(APP_ROOT, "public")));
app.use("/vendor", express.static(path.join(APP_ROOT, "node_modules", "pixi.js", "dist")));
app.use("/vendor", express.static(path.join(APP_ROOT, "node_modules", "traviso.js", "dist", "browser")));

const PORT = process.env.PORT || 4300;
app.listen(PORT, () => console.log(`iso-app (prueba) en http://localhost:${PORT}`));
