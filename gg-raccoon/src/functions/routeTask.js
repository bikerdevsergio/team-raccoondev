import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../"
);
const INBOX_DIR = path.join(PROJECT_ROOT, "shared", "inbox");

const VALID_AGENTS = ["finance-lead", "fullstack-dev", "legal-lead", "marketing-lead"];

// Mapa de palabras clave → agente. Se amplía a mano hasta que haya suficiente
// historial en graphrag_sync() para sugerir reglas nuevas.
const KEYWORD_MAP = {
  "finance-lead": ["factura", "pago", "presupuesto", "impuesto", "finanzas", "costo", "precio"],
  "fullstack-dev": ["bug", "feature", "código", "deploy", "api", "frontend", "backend", "base de datos"],
  "legal-lead": ["contrato", "legal", "términos", "privacidad", "licencia", "cumplimiento"],
  "marketing-lead": ["campaña", "marketing", "redes", "contenido", "branding", "lanzamiento"],
};

function guessAgent(description) {
  const text = description.toLowerCase();
  for (const [agent, keywords] of Object.entries(KEYWORD_MAP)) {
    if (keywords.some((kw) => text.includes(kw))) return agent;
  }
  return null;
}

/**
 * Asigna una tarea entrante al agente lead correcto.
 * @param {{ description: string, targetAgent?: string, from?: string }} task
 * @returns {Promise<{ id: string, agent: string, path: string }>}
 */
export async function routeTask(task) {
  if (!task || typeof task.description !== "string" || !task.description.trim()) {
    throw new Error("route_task: 'task.description' es obligatorio");
  }

  let agent = task.targetAgent;
  if (agent && !VALID_AGENTS.includes(agent)) {
    throw new Error(`route_task: agente destino inválido '${agent}'`);
  }
  if (!agent) {
    agent = guessAgent(task.description);
  }
  if (!agent) {
    throw new Error(
      `route_task: no se pudo determinar el agente destino para: "${task.description}". Especificá 'targetAgent'.`
    );
  }

  const id = randomUUID();
  const record = {
    id,
    description: task.description,
    from: task.from ?? "dante",
    agent,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  const agentDir = path.join(INBOX_DIR, agent);
  await mkdir(agentDir, { recursive: true });
  const filePath = path.join(agentDir, `${id}.json`);
  await writeFile(filePath, JSON.stringify(record, null, 2), "utf-8");

  return { id, agent, path: filePath };
}
