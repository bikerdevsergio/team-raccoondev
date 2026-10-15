import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../"
);
const QUEUE_PATH = path.join(PROJECT_ROOT, "shared", "approval_queue.json");

async function readQueue() {
  try {
    const raw = await readFile(QUEUE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function writeQueue(queue) {
  await mkdir(path.dirname(QUEUE_PATH), { recursive: true });
  await writeFile(QUEUE_PATH, JSON.stringify(queue, null, 2), "utf-8");
}

/**
 * Agrega una nueva solicitud a la cola de aprobación del CEO.
 * @param {{ title: string, description?: string, proposedBy: string }} request
 * @returns {Promise<object>} el item creado
 */
export async function addApprovalRequest(request) {
  if (!request || typeof request.title !== "string" || !request.title.trim()) {
    throw new Error("approval_queue: 'request.title' es obligatorio");
  }
  if (!request.proposedBy) {
    throw new Error("approval_queue: 'request.proposedBy' es obligatorio");
  }

  const queue = await readQueue();
  const item = {
    id: randomUUID(),
    title: request.title,
    description: request.description ?? "",
    proposedBy: request.proposedBy,
    status: "pending",
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    resolution: null,
  };
  queue.push(item);
  await writeQueue(queue);
  return item;
}

/**
 * Lista la cola de aprobación, opcionalmente filtrada por estado.
 * @param {"pending"|"approved"|"rejected"} [status]
 * @returns {Promise<object[]>}
 */
export async function listApprovalQueue(status) {
  const queue = await readQueue();
  return status ? queue.filter((item) => item.status === status) : queue;
}

/**
 * Resuelve un item de la cola (aprobado o rechazado por el CEO).
 * @param {string} id
 * @param {"approved"|"rejected"} decision
 * @param {string} [reason]
 * @returns {Promise<object>} el item actualizado
 */
export async function resolveApprovalRequest(id, decision, reason) {
  if (decision !== "approved" && decision !== "rejected") {
    throw new Error("approval_queue: 'decision' debe ser 'approved' o 'rejected'");
  }

  const queue = await readQueue();
  const item = queue.find((entry) => entry.id === id);
  if (!item) {
    throw new Error(`approval_queue: no existe un item pendiente con id '${id}'`);
  }

  item.status = decision;
  item.resolvedAt = new Date().toISOString();
  item.resolution = reason ?? null;
  await writeQueue(queue);
  return item;
}
