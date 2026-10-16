import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const BUGS_PATH = path.join(PROJECT_ROOT, "shared", "bugs", "bugs.json");

const VALID_SEVERITIES = ["low", "medium", "high", "critical"];

async function readBugs() {
  try {
    return JSON.parse(await readFile(BUGS_PATH, "utf-8"));
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function writeBugs(list) {
  await mkdir(path.dirname(BUGS_PATH), { recursive: true });
  await writeFile(BUGS_PATH, JSON.stringify(list, null, 2), "utf-8");
}

/**
 * Registra un bug en el ledger compartido shared/bugs/bugs.json.
 * @param {{ title: string, description?: string, project: string, severity: "low"|"medium"|"high"|"critical", reportedBy: string }} entry
 * @returns {Promise<object>} el registro creado
 */
export async function bugTracker(entry) {
  if (!entry || !entry.title || !entry.project) {
    throw new Error("bug_tracker: 'entry.title' y 'entry.project' son obligatorios");
  }
  if (!VALID_SEVERITIES.includes(entry.severity)) {
    throw new Error(`bug_tracker: 'entry.severity' debe ser uno de: ${VALID_SEVERITIES.join(", ")}`);
  }
  if (!entry.reportedBy) {
    throw new Error("bug_tracker: 'entry.reportedBy' es obligatorio");
  }

  const bugs = await readBugs();
  const record = {
    id: randomUUID(),
    title: entry.title,
    description: entry.description ?? "",
    project: entry.project,
    severity: entry.severity,
    status: "open",
    reportedBy: entry.reportedBy,
    createdAt: new Date().toISOString(),
  };
  bugs.push(record);
  await writeBugs(bugs);

  return record;
}
