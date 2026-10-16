import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PHASES } from "../lib/devCycle.js";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const INBOX_DIR = path.join(PROJECT_ROOT, "shared", "inbox", "fullstack-dev");
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
 * Convierte una especificación en una tarea estructurada en
 * shared/inbox/fullstack-dev/. SIEMPRE arranca en fase "requisitos" — si
 * alguien intenta crearla ya en una fase posterior (saltándose el ciclo),
 * Volt NO la crea: la congela y escala a CEO vía shared/escalations.json.
 * @param {{ description: string, project: string, requestedPhase?: string }} spec
 * @returns {Promise<object>} la tarea creada, o la escalación si se detectó un salto de fase
 */
export async function createTask(spec) {
  if (!spec || !spec.description || !spec.project) {
    throw new Error("create_task: 'spec.description' y 'spec.project' son obligatorios");
  }

  if (spec.requestedPhase && spec.requestedPhase !== PHASES[0]) {
    const escalations = await readEscalations();
    const escalation = {
      id: randomUUID(),
      title: `Volt intentó saltarse el ciclo: tarea creada directo en fase "${spec.requestedPhase}"`,
      description: `Proyecto: ${spec.project}. Descripción: ${spec.description}. El ciclo obligatorio es ${PHASES.join(" → ")} — toda tarea nueva arranca en "${PHASES[0]}".`,
      context: JSON.stringify(spec),
      raisedBy: "volt",
      status: "awaiting_ceo",
      createdAt: new Date().toISOString(),
      resolvedAt: null,
      ceoDecision: null,
      ceoNote: null,
    };
    escalations.push(escalation);
    await writeEscalations(escalations);
    return { created: false, escalation };
  }

  const id = randomUUID();
  const task = {
    id,
    description: spec.description,
    project: spec.project,
    phase: PHASES[0],
    phaseHistory: [{ phase: PHASES[0], enteredAt: new Date().toISOString(), approvedBy: null }],
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  await mkdir(INBOX_DIR, { recursive: true });
  await writeFile(path.join(INBOX_DIR, `${id}.json`), JSON.stringify(task, null, 2), "utf-8");

  return { created: true, task };
}
