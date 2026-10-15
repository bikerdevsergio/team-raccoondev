import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
 * Evalúa si un proyecto es rentable (margen real vs mínimo aceptable).
 * Si NO es rentable, lo cancela por default y escala a CEO vía
 * shared/escalations.json — solo una aprobación explícita del CEO
 * (resolveEscalation) permite seguir adelante con un proyecto no rentable.
 * @param {{ name: string, totalCost: number, proposedPrice: number, minMarginPercent?: number }} project
 * @returns {Promise<{ rentable: boolean, marginPercent: number, status: string, escalation?: object }>}
 */
export async function rentabilityCheck(project) {
  if (!project || !project.name || typeof project.totalCost !== "number" || typeof project.proposedPrice !== "number") {
    throw new Error("rentability_check: 'project.name', 'totalCost' y 'proposedPrice' son obligatorios");
  }

  const minMargin = project.minMarginPercent ?? 0;
  const marginPercent = project.proposedPrice > 0
    ? ((project.proposedPrice - project.totalCost) / project.proposedPrice) * 100
    : -100;

  if (marginPercent >= minMargin) {
    return { rentable: true, marginPercent, status: "approved" };
  }

  const escalations = await readEscalations();
  const escalation = {
    id: randomUUID(),
    title: `Proyecto no rentable, cancelado por default: ${project.name}`,
    description: `Margen calculado ${marginPercent.toFixed(1)}% (mínimo aceptable: ${minMargin}%). Costo: ${project.totalCost}, precio propuesto: ${project.proposedPrice}. Midas lo canceló — necesita tu aprobación explícita para seguir adelante.`,
    context: JSON.stringify(project),
    raisedBy: "midas",
    status: "awaiting_ceo",
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    ceoDecision: null,
    ceoNote: null,
  };
  escalations.push(escalation);
  await writeEscalations(escalations);

  return { rentable: false, marginPercent, status: "cancelled_pending_ceo", escalation };
}
