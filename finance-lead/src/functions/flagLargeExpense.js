import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { trackExpense } from "./trackExpense.js";

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
 * Si el gasto supera el umbral, lo congela (NO lo registra en el ledger
 * todavía) y lo escala a Dante/CEO escribiendo en shared/escalations.json
 * — el mismo archivo que lee escalate_to_ceo() de Dante. Si no supera el
 * umbral, lo registra normalmente con track_expense.
 * @param {{ amount: number, category: string, description?: string, project?: string, createdBy: string }} entry
 * @param {number} threshold
 * @returns {Promise<{ frozen: boolean, record: object }>}
 */
export async function flagLargeExpense(entry, threshold) {
  if (typeof threshold !== "number" || threshold <= 0) {
    throw new Error("flag_large_expense: 'threshold' debe ser un número positivo");
  }
  if (!entry || typeof entry.amount !== "number") {
    throw new Error("flag_large_expense: 'entry.amount' es obligatorio");
  }

  if (entry.amount <= threshold) {
    const record = await trackExpense(entry);
    return { frozen: false, record };
  }

  const escalations = await readEscalations();
  const escalation = {
    id: randomUUID(),
    title: `Gasto grande pendiente de aprobación: ${entry.category}`,
    description: `Midas detectó un gasto de ${entry.amount} en "${entry.category}" (umbral: ${threshold}). ${entry.description ?? ""}`.trim(),
    context: JSON.stringify(entry),
    raisedBy: "midas",
    status: "awaiting_ceo",
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    ceoDecision: null,
    ceoNote: null,
  };
  escalations.push(escalation);
  await writeEscalations(escalations);

  return { frozen: true, record: escalation };
}
