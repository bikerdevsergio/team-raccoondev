import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const STATUS_PATH = path.join(PROJECT_ROOT, "shared", "status", "legal-lead.json");
const ESCALATIONS_PATH = path.join(PROJECT_ROOT, "shared", "escalations.json");
const DEADLINES_PATH = path.join(PROJECT_ROOT, "shared", "legal", "deadlines.json");

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf-8"));
  } catch (err) {
    if (err.code === "ENOENT") return fallback;
    throw err;
  }
}

/**
 * Actualiza shared/status/legal-lead.json con el estado actual de Themis,
 * escalaciones propias pendientes y vencimientos próximos (30 días).
 * check_agent_status() de Dante lee este mismo archivo.
 * @param {{ state?: "idle"|"busy"|"blocked", currentTask?: string|null }} [overrides]
 * @returns {Promise<object>} el estado actualizado
 */
export async function syncStatus(overrides = {}) {
  const [escalations, deadlines, current] = await Promise.all([
    readJson(ESCALATIONS_PATH, []),
    readJson(DEADLINES_PATH, []),
    readJson(STATUS_PATH, {}),
  ]);

  const ownPendingEscalations = escalations.filter(
    (e) => e.raisedBy === "themis" && e.status === "awaiting_ceo"
  );

  const now = new Date();
  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const upcomingDeadlines = deadlines.filter(
    (d) => d.status === "pending" && new Date(d.dueDate) <= thirtyDaysFromNow && new Date(d.dueDate) >= now
  );

  const updated = {
    ...current,
    agent: "legal-lead",
    state: overrides.state ?? current.state ?? "idle",
    currentTask: overrides.currentTask ?? current.currentTask ?? null,
    lastUpdated: new Date().toISOString(),
    pendingEscalations: ownPendingEscalations.length,
    upcomingDeadlines: upcomingDeadlines.length,
  };

  await mkdir(path.dirname(STATUS_PATH), { recursive: true });
  await writeFile(STATUS_PATH, JSON.stringify(updated, null, 2), "utf-8");

  return updated;
}
