import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const STATUS_PATH = path.join(PROJECT_ROOT, "shared", "status", "marketing-lead.json");
const ESCALATIONS_PATH = path.join(PROJECT_ROOT, "shared", "escalations.json");
const LEADS_PATH = path.join(PROJECT_ROOT, "shared", "marketing", "leads.json");

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf-8"));
  } catch (err) {
    if (err.code === "ENOENT") return fallback;
    throw err;
  }
}

/**
 * Actualiza shared/status/marketing-lead.json con el estado actual de
 * Hermes, escalaciones propias pendientes y leads nuevos sin procesar.
 * check_agent_status() de Dante lee este mismo archivo.
 * @param {{ state?: "idle"|"busy"|"blocked", currentTask?: string|null }} [overrides]
 * @returns {Promise<object>} el estado actualizado
 */
export async function syncStatus(overrides = {}) {
  const [escalations, leads, current] = await Promise.all([
    readJson(ESCALATIONS_PATH, []),
    readJson(LEADS_PATH, []),
    readJson(STATUS_PATH, {}),
  ]);

  const ownPendingEscalations = escalations.filter(
    (e) => e.raisedBy === "hermes" && e.status === "awaiting_ceo"
  );
  const newLeads = leads.filter((l) => l.status === "new");

  const updated = {
    ...current,
    agent: "marketing-lead",
    state: overrides.state ?? current.state ?? "idle",
    currentTask: overrides.currentTask ?? current.currentTask ?? null,
    lastUpdated: new Date().toISOString(),
    pendingEscalations: ownPendingEscalations.length,
    newLeads: newLeads.length,
  };

  await mkdir(path.dirname(STATUS_PATH), { recursive: true });
  await writeFile(STATUS_PATH, JSON.stringify(updated, null, 2), "utf-8");

  return updated;
}
