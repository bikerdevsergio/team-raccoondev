import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const STATUS_PATH = path.join(PROJECT_ROOT, "shared", "status", "finance-lead.json");
const ESCALATIONS_PATH = path.join(PROJECT_ROOT, "shared", "escalations.json");

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf-8"));
  } catch (err) {
    if (err.code === "ENOENT") return fallback;
    throw err;
  }
}

/**
 * Actualiza shared/status/finance-lead.json con el estado actual de Midas
 * y un snapshot liviano de escalaciones de gasto propias pendientes.
 * check_agent_status() de Dante lee este mismo archivo.
 * @param {{ state?: "idle"|"busy"|"blocked", currentTask?: string|null }} [overrides]
 * @returns {Promise<object>} el estado actualizado
 */
export async function syncStatus(overrides = {}) {
  const escalations = await readJson(ESCALATIONS_PATH, []);
  const ownPendingEscalations = escalations.filter(
    (e) => e.raisedBy === "midas" && e.status === "awaiting_ceo"
  );

  const current = await readJson(STATUS_PATH, {});

  const updated = {
    ...current,
    agent: "finance-lead",
    state: overrides.state ?? current.state ?? "idle",
    currentTask: overrides.currentTask ?? current.currentTask ?? null,
    lastUpdated: new Date().toISOString(),
    pendingExpenseEscalations: ownPendingEscalations.length,
  };

  await mkdir(path.dirname(STATUS_PATH), { recursive: true });
  await writeFile(STATUS_PATH, JSON.stringify(updated, null, 2), "utf-8");

  return updated;
}
