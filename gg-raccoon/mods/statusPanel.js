import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkAgentStatus } from "../src/functions/checkAgentStatus.js";
import { listApprovalQueue } from "../src/functions/approvalQueue.js";
import { listEscalations } from "../src/functions/escalateToCeo.js";
import { listConflicts } from "../src/functions/conflictResolver.js";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../");
const STATUS_PATH = path.join(PROJECT_ROOT, "shared", "status", "gg-raccoon.json");

/**
 * Mod de UI: actualiza shared/status/gg-raccoon.json con el estado del
 * equipo, aprobaciones pendientes, escalaciones y conflictos congelados.
 * No genera HTML — la PWA (cuando exista) lee este JSON y lo muestra
 * visualmente en la recepción de Dante.
 * @returns {Promise<object>} el estado actualizado
 */
export async function updateStatusPanel() {
  const [team, pendingApprovals, pendingEscalations, frozenConflicts] = await Promise.all([
    checkAgentStatus(),
    listApprovalQueue("pending"),
    listEscalations("awaiting_ceo"),
    listConflicts("frozen"),
  ]);

  const dante = team.find((s) => s.agent === "gg-raccoon") ?? { state: "unknown", currentTask: null };

  let current = {};
  try {
    current = JSON.parse(await readFile(STATUS_PATH, "utf-8"));
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }

  const updated = {
    ...current,
    agent: "gg-raccoon",
    state: dante.state,
    currentTask: dante.currentTask,
    lastUpdated: new Date().toISOString(),
    team,
    pendingApprovals,
    pendingEscalations,
    frozenConflicts,
  };

  await writeFile(STATUS_PATH, JSON.stringify(updated, null, 2), "utf-8");
  return updated;
}
