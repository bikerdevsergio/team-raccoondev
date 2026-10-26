import express from "express";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const SHARED_DIR = path.join(PROJECT_ROOT, "shared");
const FRONTEND_DIR = path.join(PROJECT_ROOT, "pwa", "frontend");

const AGENTS = [
  { id: "gg-raccoon", name: "Dante", role: "Gerente General" },
  { id: "finance-lead", name: "Midas", role: "Lead de Finanzas" },
  { id: "fullstack-dev", name: "Volt", role: "CTO" },
  { id: "legal-lead", name: "Themis", role: "Lead Legal" },
  { id: "marketing-lead", name: "Hermes", role: "Lead de Marketing" },
];

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf-8"));
  } catch (err) {
    if (err.code === "ENOENT") return fallback;
    throw err;
  }
}

const app = express();

app.use(express.static(FRONTEND_DIR));

app.get("/api/agents", (_req, res) => {
  res.json(AGENTS);
});

app.get("/api/status/:agentId", async (req, res) => {
  const agent = AGENTS.find((a) => a.id === req.params.agentId);
  if (!agent) {
    res.status(404).json({ error: "agente no reconocido" });
    return;
  }
  const status = await readJson(path.join(SHARED_DIR, "status", `${agent.id}.json`), {
    agent: agent.id,
    state: "unknown",
    currentTask: null,
    lastUpdated: null,
  });
  res.json(status);
});

app.get("/api/escalations", async (_req, res) => {
  const escalations = await readJson(path.join(SHARED_DIR, "escalations.json"), []);
  res.json(escalations);
});

app.get("/api/approvals", async (_req, res) => {
  const approvals = await readJson(path.join(SHARED_DIR, "approval_queue.json"), []);
  res.json(approvals);
});

app.get("/api/conflicts", async (_req, res) => {
  const conflicts = await readJson(path.join(SHARED_DIR, "conflicts.json"), []);
  res.json(conflicts);
});

app.get("/api/overview", async (_req, res) => {
  const [escalations, approvals, conflicts, statuses] = await Promise.all([
    readJson(path.join(SHARED_DIR, "escalations.json"), []),
    readJson(path.join(SHARED_DIR, "approval_queue.json"), []),
    readJson(path.join(SHARED_DIR, "conflicts.json"), []),
    Promise.all(
      AGENTS.map((a) =>
        readJson(path.join(SHARED_DIR, "status", `${a.id}.json`), {
          agent: a.id,
          state: "unknown",
          currentTask: null,
          lastUpdated: null,
        })
      )
    ),
  ]);

  res.json({
    team: statuses,
    pendingEscalations: escalations.filter((e) => e.status === "awaiting_ceo"),
    pendingApprovals: approvals.filter((a) => a.status === "pending"),
    frozenConflicts: conflicts.filter((c) => c.status === "frozen"),
    generatedAt: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 4100;
app.listen(PORT, () => {
  console.log(`PWA backend escuchando en http://localhost:${PORT}`);
});
