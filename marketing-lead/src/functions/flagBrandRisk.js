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
 * Congela una pieza de comunicación riesgosa (reputacional/legal) y la
 * escala a CEO vía shared/escalations.json. Hermes NUNCA decide sola.
 * @param {string} description
 * @param {string} [context]
 * @returns {Promise<object>} la escalación creada
 */
export async function flagBrandRisk(description, context) {
  if (!description || !description.trim()) {
    throw new Error("flag_brand_risk: 'description' es obligatorio");
  }

  const escalations = await readEscalations();
  const escalation = {
    id: randomUUID(),
    title: "Riesgo de marca detectado",
    description,
    context: context ?? null,
    raisedBy: "hermes",
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
