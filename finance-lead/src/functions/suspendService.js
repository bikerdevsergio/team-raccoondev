import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { portfolioManager } from "./portfolioManager.js";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const ESCALATIONS_PATH = path.join(PROJECT_ROOT, "shared", "escalations.json");

async function readEscalations() {
  try {
    return JSON.parse(await readFile(ESCALATIONS_PATH, "utf-8"));
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
 * Propone la suspensión de servicio de un cliente por no pago. NUNCA
 * ejecuta la suspensión — solo la escala a CEO vía shared/escalations.json.
 * Requiere aprobación explícita antes de que cualquier otro agente actúe.
 * @param {{ clientId: string, reason?: string }} client
 * @returns {Promise<object>} la escalación creada
 */
export async function suspendService(client) {
  if (!client || !client.clientId) {
    throw new Error("suspend_service: 'client.clientId' es obligatorio");
  }

  const portfolio = await portfolioManager();
  const clientData = portfolio.clients.find((c) => c.clientId === client.clientId);
  if (!clientData) {
    throw new Error(`suspend_service: no hay datos de facturación para el clientId '${client.clientId}'`);
  }

  const escalations = await readEscalations();
  const escalation = {
    id: randomUUID(),
    title: `Propuesta de suspensión de servicio: ${clientData.clientName}`,
    description: `Deuda pendiente: ${clientData.pendingDebt} ${portfolio.currency}. ${client.reason ?? ""}`.trim(),
    context: JSON.stringify({ clientId: client.clientId, pendingDebt: clientData.pendingDebt }),
    raisedBy: "midas",
    status: "awaiting_ceo",
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    ceoDecision: null,
    ceoNote: null,
  };
  escalations.push(escalation);
  await writeEscalations(escalations);

  return escalation;
}
