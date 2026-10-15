import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { devlogWriter } from "./devlogWriter.js";
import { sendMail } from "../lib/mailer.js";
import { pushNotification } from "../lib/notifications.js";

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../"
);
const ESCALATIONS_PATH = path.join(PROJECT_ROOT, "shared", "escalations.json");

async function readEscalations() {
  try {
    const raw = await readFile(ESCALATIONS_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function writeEscalations(list) {
  await mkdir(path.dirname(ESCALATIONS_PATH), { recursive: true });
  await writeFile(ESCALATIONS_PATH, JSON.stringify(list, null, 2), "utf-8");
}

/**
 * Marca una decisión como importante: la congela en shared/escalations.json
 * con estado "awaiting_ceo" y deja registro en el DEVLOG. El agente que la
 * generó NO debe proceder hasta que el CEO la resuelva con resolveEscalation().
 * @param {{ title: string, description: string, raisedBy: string, context?: string }} decision
 * @returns {Promise<object>} el item creado
 */
export async function escalateToCeo(decision) {
  if (!decision || typeof decision.title !== "string" || !decision.title.trim()) {
    throw new Error("escalate_to_ceo: 'decision.title' es obligatorio");
  }
  if (typeof decision.description !== "string" || !decision.description.trim()) {
    throw new Error("escalate_to_ceo: 'decision.description' es obligatorio");
  }
  if (!decision.raisedBy) {
    throw new Error("escalate_to_ceo: 'decision.raisedBy' es obligatorio");
  }

  const list = await readEscalations();
  const item = {
    id: randomUUID(),
    title: decision.title,
    description: decision.description,
    context: decision.context ?? null,
    raisedBy: decision.raisedBy,
    status: "awaiting_ceo",
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    ceoDecision: null,
    ceoNote: null,
  };
  list.push(item);
  await writeEscalations(list);

  await devlogWriter({
    title: `Decisión escalada al CEO: ${item.title}`,
    author: item.raisedBy,
    details: [item.description],
    reason: "Marcada como importante, el agente queda bloqueado hasta resolución del CEO.",
  });

  await pushNotification({
    agent: "gg-raccoon",
    type: "escalation",
    title: `Decisión pendiente: ${item.title}`,
    message: item.description,
  });

  await sendMail({
    to: process.env.CEO_EMAIL,
    subject: `[RaccoonDev] Decisión escalada: ${item.title}`,
    text: `${item.description}\n\nPlanteada por: ${item.raisedBy}\nID: ${item.id}\n\nResolvé con resolveEscalation('${item.id}', 'approved' | 'rejected' | 'modified', nota opcional).`,
  });

  return item;
}

/**
 * Lista las escalaciones, opcionalmente filtradas por estado.
 * @param {"awaiting_ceo"|"resolved"} [status]
 * @returns {Promise<object[]>}
 */
export async function listEscalations(status) {
  const list = await readEscalations();
  return status ? list.filter((item) => item.status === status) : list;
}

/**
 * El CEO resuelve una escalación.
 * @param {string} id
 * @param {"approved"|"rejected"|"modified"} ceoDecision
 * @param {string} [note]
 * @returns {Promise<object>} el item actualizado
 */
export async function resolveEscalation(id, ceoDecision, note) {
  if (!["approved", "rejected", "modified"].includes(ceoDecision)) {
    throw new Error("escalate_to_ceo: 'ceoDecision' debe ser 'approved', 'rejected' o 'modified'");
  }

  const list = await readEscalations();
  const item = list.find((entry) => entry.id === id);
  if (!item) {
    throw new Error(`escalate_to_ceo: no existe una escalación con id '${id}'`);
  }

  item.status = "resolved";
  item.ceoDecision = ceoDecision;
  item.ceoNote = note ?? null;
  item.resolvedAt = new Date().toISOString();
  await writeEscalations(list);

  await devlogWriter({
    title: `Escalación resuelta: ${item.title}`,
    author: "sergi",
    details: [`Decisión: ${ceoDecision}`, ...(note ? [note] : [])],
  });

  return item;
}
