import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { escalateToCeo } from "./escalateToCeo.js";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const CONFLICTS_PATH = path.join(PROJECT_ROOT, "shared", "conflicts.json");
const INBOX_DIR = path.join(PROJECT_ROOT, "shared", "inbox");

async function readConflicts() {
  try {
    return JSON.parse(await readFile(CONFLICTS_PATH, "utf-8"));
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function writeConflicts(list) {
  await mkdir(path.dirname(CONFLICTS_PATH), { recursive: true });
  await writeFile(CONFLICTS_PATH, JSON.stringify(list, null, 2), "utf-8");
}

/**
 * Congela un conflicto entre dos o más agentes (misma tarea reclamada,
 * resultados contradictorios, etc). NUNCA resuelve el conflicto por su
 * cuenta: lo congela, marca las tareas involucradas como "frozen_conflict"
 * si existen en el inbox compartido, y escala al CEO vía escalate_to_ceo.
 * @param {{ taskId?: string, agentsInvolved: string[], description: string }} task
 * @returns {Promise<object>} el conflicto creado
 */
export async function conflictResolver(task) {
  if (!task || !Array.isArray(task.agentsInvolved) || task.agentsInvolved.length < 2) {
    throw new Error("conflict_resolver: 'task.agentsInvolved' debe tener al menos 2 agentes");
  }
  if (typeof task.description !== "string" || !task.description.trim()) {
    throw new Error("conflict_resolver: 'task.description' es obligatorio");
  }

  const list = await readConflicts();
  const conflict = {
    id: randomUUID(),
    taskId: task.taskId ?? null,
    agentsInvolved: task.agentsInvolved,
    description: task.description,
    status: "frozen",
    createdAt: new Date().toISOString(),
  };
  list.push(conflict);
  await writeConflicts(list);

  if (task.taskId) {
    for (const agent of task.agentsInvolved) {
      const filePath = path.join(INBOX_DIR, agent, `${task.taskId}.json`);
      try {
        const record = JSON.parse(await readFile(filePath, "utf-8"));
        record.status = "frozen_conflict";
        record.conflictId = conflict.id;
        await writeFile(filePath, JSON.stringify(record, null, 2), "utf-8");
      } catch (err) {
        if (err.code !== "ENOENT") throw err;
      }
    }
  }

  await escalateToCeo({
    title: `Conflicto entre agentes: ${task.agentsInvolved.join(" vs ")}`,
    description: task.description,
    raisedBy: "dante",
    context: `conflictId=${conflict.id}${task.taskId ? `, taskId=${task.taskId}` : ""}`,
  });

  return conflict;
}

/**
 * Lista los conflictos registrados, opcionalmente filtrados por estado.
 * @param {"frozen"|"resolved"} [status]
 * @returns {Promise<object[]>}
 */
export async function listConflicts(status) {
  const list = await readConflicts();
  return status ? list.filter((c) => c.status === status) : list;
}
