import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const STATUS_PATH = path.join(PROJECT_ROOT, "shared", "status", "fullstack-dev.json");
const ESCALATIONS_PATH = path.join(PROJECT_ROOT, "shared", "escalations.json");
const BUGS_PATH = path.join(PROJECT_ROOT, "shared", "bugs", "bugs.json");

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf-8"));
  } catch (err) {
    if (err.code === "ENOENT") return fallback;
    throw err;
  }
}

/**
 * Actualiza shared/status/fullstack-dev.json con el estado actual de Volt,
 * escalaciones propias pendientes y bugs abiertos. check_agent_status()
 * de Dante lee este mismo archivo.
 * @param {{ state?: "idle"|"busy"|"blocked", currentTask?: string|null }} [overrides]
 * @returns {Promise<object>} el estado actualizado
 */
export async function syncStatus(overrides = {}) {
  const [escalations, bugs, current] = await Promise.all([
    readJson(ESCALATIONS_PATH, []),
    readJson(BUGS_PATH, []),
    readJson(STATUS_PATH, {}),
  ]);

  const ownPendingEscalations = escalations.filter(
    (e) => e.raisedBy === "volt" && e.status === "awaiting_ceo"
  );
  const openBugs = bugs.filter((b) => b.status === "open");

  const updated = {
    ...current,
    agent: "fullstack-dev",
    state: overrides.state ?? current.state ?? "idle",
    currentTask: overrides.currentTask ?? current.currentTask ?? null,
    lastUpdated: new Date().toISOString(),
    pendingEscalations: ownPendingEscalations.length,
    openBugs: openBugs.length,
  };

  await mkdir(path.dirname(STATUS_PATH), { recursive: true });
  await writeFile(STATUS_PATH, JSON.stringify(updated, null, 2), "utf-8");

  return updated;
}
