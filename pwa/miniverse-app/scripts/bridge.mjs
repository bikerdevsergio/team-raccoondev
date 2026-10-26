// Traduce el estado real de los agentes (shared/status/*.json) a heartbeats
// del servidor de Miniverse, cada pocos segundos. No inventa estado: si un
// agente no tiene status.json todavía, no manda heartbeat (Miniverse no lo
// muestra hasta que exista estado real).
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const STATUS_DIR = path.join(PROJECT_ROOT, "shared", "status");
const MINIVERSE_SERVER = process.env.MINIVERSE_SERVER ?? "http://localhost:4321";
const INTERVAL_MS = 5000;

const AGENTS = [
  { id: "dante", statusFile: "gg-raccoon" },
  { id: "midas", statusFile: "finance-lead" },
  { id: "volt", statusFile: "fullstack-dev" },
  { id: "themis", statusFile: "legal-lead" },
  { id: "hermes", statusFile: "marketing-lead" },
];

const STATE_MAP = { idle: "idle", busy: "working", blocked: "error" };

async function readStatus(fileName) {
  try {
    return JSON.parse(await readFile(path.join(STATUS_DIR, `${fileName}.json`), "utf-8"));
  } catch {
    return null;
  }
}

async function sendHeartbeat(agent, status) {
  const body = {
    agent: agent.id,
    name: agent.id,
    state: STATE_MAP[status.state] ?? "idle",
    task: status.currentTask ?? null,
  };
  await fetch(`${MINIVERSE_SERVER}/api/heartbeat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch((err) => console.error(`[bridge] heartbeat falló para ${agent.id}:`, err.message));
}

async function tick() {
  for (const agent of AGENTS) {
    const status = await readStatus(agent.statusFile);
    if (status) await sendHeartbeat(agent, status);
  }
}

console.log(`[bridge] enviando heartbeats a ${MINIVERSE_SERVER} cada ${INTERVAL_MS / 1000}s`);
tick();
setInterval(tick, INTERVAL_MS);
