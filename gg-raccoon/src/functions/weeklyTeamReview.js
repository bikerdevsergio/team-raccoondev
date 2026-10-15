import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkAgentStatus } from "./checkAgentStatus.js";
import { listConflicts } from "./conflictResolver.js";
import { listEscalations } from "./escalateToCeo.js";
import { devlogWriter } from "./devlogWriter.js";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const INBOX_DIR = path.join(PROJECT_ROOT, "shared", "inbox");
const DEVLOG_PATH = path.join(PROJECT_ROOT, "DEVLOG.md");
const REVIEWS_DIR = path.join(PROJECT_ROOT, "shared", "weekly_reviews");

const LEAD_AGENTS = ["finance-lead", "fullstack-dev", "legal-lead", "marketing-lead"];

async function countInboxTasks(agent) {
  const agentDir = path.join(INBOX_DIR, agent);
  const counts = {};
  let files;
  try {
    files = await readdir(agentDir);
  } catch (err) {
    if (err.code === "ENOENT") return counts;
    throw err;
  }
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const task = JSON.parse(await readFile(path.join(agentDir, file), "utf-8"));
    counts[task.status] = (counts[task.status] ?? 0) + 1;
  }
  return counts;
}

async function devlogHighlightsSince(cutoffDate) {
  let content;
  try {
    content = await readFile(DEVLOG_PATH, "utf-8");
  } catch (err) {
    if (err.code === "ENOENT") return {};
  }

  const blocks = content.split(/\n(?=## )/);
  const byAgent = {};

  for (const block of blocks) {
    const headingMatch = block.match(/^## (\d{4}-\d{2}-\d{2}) — (.+)/);
    if (!headingMatch) continue;
    const [, dateStr, title] = headingMatch;
    if (new Date(dateStr) < cutoffDate) continue;

    const authorMatch = block.match(/\*\*Autor:\*\* (.+)/);
    const author = authorMatch ? authorMatch[1].trim() : "desconocido";
    const normalized = author === "dante" ? "gg-raccoon" : author;

    byAgent[normalized] = byAgent[normalized] ?? [];
    byAgent[normalized].push(`[${dateStr}] ${title}`);
  }

  return byAgent;
}

/**
 * Compila el estado semanal del equipo: progreso (tareas por estado),
 * bloqueos (conflictos congelados + escalaciones pendientes) y highlights
 * (entradas del DEVLOG de los últimos 7 días) por agente.
 * @returns {Promise<object>} el reporte generado
 */
export async function weeklyTeamReview() {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 7);

  const statuses = await checkAgentStatus();
  const highlightsByAgent = await devlogHighlightsSince(cutoff);
  const frozenConflicts = await listConflicts("frozen");
  const pendingEscalations = await listEscalations("awaiting_ceo");

  const agents = [];
  for (const statusEntry of statuses) {
    const tasks = LEAD_AGENTS.includes(statusEntry.agent)
      ? await countInboxTasks(statusEntry.agent)
      : {};
    agents.push({
      agent: statusEntry.agent,
      state: statusEntry.state,
      tasks,
      highlights: highlightsByAgent[statusEntry.agent] ?? [],
    });
  }

  const report = {
    generatedAt: now.toISOString(),
    period: { from: cutoff.toISOString(), to: now.toISOString() },
    agents,
    blockers: {
      frozenConflicts: frozenConflicts.length,
      pendingEscalations: pendingEscalations.length,
    },
  };

  await mkdir(REVIEWS_DIR, { recursive: true });
  const fileName = `${now.toISOString().slice(0, 10)}.json`;
  await writeFile(path.join(REVIEWS_DIR, fileName), JSON.stringify(report, null, 2), "utf-8");

  await devlogWriter({
    title: "Revisión semanal del equipo",
    author: "dante",
    details: [
      ...agents.map((a) => `${a.agent}: ${a.state}, ${a.highlights.length} highlight(s)`),
      `${report.blockers.frozenConflicts} conflicto(s) congelado(s), ${report.blockers.pendingEscalations} escalación(es) pendiente(s)`,
    ],
  });

  return report;
}
