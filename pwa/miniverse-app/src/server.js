import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sendChatMessage, getChatHistory } from "./chat.js";

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../");
const PUBLIC_DIR = path.join(APP_ROOT, "public");
const CORE_DIST = path.join(APP_ROOT, "node_modules", "@miniverse", "core", "dist");

const app = express();
app.use(express.json({ limit: "25mb" }));

app.use(express.static(PUBLIC_DIR));
app.use("/vendor/miniverse-core", express.static(CORE_DIST));

app.get("/api/chat/:officeId/history", async (req, res) => {
  try {
    const messages = await getChatHistory(req.params.officeId);
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/chat/:officeId", async (req, res) => {
  try {
    const { text, attachments } = req.body ?? {};
    const result = await sendChatMessage(req.params.officeId, { text, attachments });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4200;
app.listen(PORT, () => {
  console.log(`RaccoonDev HQ (Miniverse) escuchando en http://localhost:${PORT}`);
});
