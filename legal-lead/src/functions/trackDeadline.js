import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const DEADLINES_PATH = path.join(PROJECT_ROOT, "shared", "legal", "deadlines.json");

async function readDeadlines() {
  try {
    return JSON.parse(await readFile(DEADLINES_PATH, "utf-8"));
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function writeDeadlines(list) {
  await mkdir(path.dirname(DEADLINES_PATH), { recursive: true });
  await writeFile(DEADLINES_PATH, JSON.stringify(list, null, 2), "utf-8");
}

/**
 * Registra un vencimiento legal en el ledger compartido shared/legal/deadlines.json.
 * @param {{ title: string, dueDate: string, type: string, project?: string, description?: string }} entry
 * @returns {Promise<object>} el registro creado
 */
export async function trackDeadline(entry) {
  if (!entry || !entry.title || !entry.dueDate || !entry.type) {
    throw new Error("track_deadline: 'entry.title', 'entry.dueDate' y 'entry.type' son obligatorios");
  }
  if (isNaN(new Date(entry.dueDate))) {
    throw new Error("track_deadline: 'entry.dueDate' debe ser una fecha ISO válida");
  }

  const deadlines = await readDeadlines();
  const record = {
    id: randomUUID(),
    title: entry.title,
    type: entry.type,
    project: entry.project ?? null,
    description: entry.description ?? "",
    dueDate: new Date(entry.dueDate).toISOString(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  deadlines.push(record);
  await writeDeadlines(deadlines);

  return record;
}
