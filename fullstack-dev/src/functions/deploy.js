import { exec } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const DEPLOY_CONFIGS_PATH = path.join(PROJECT_ROOT, "shared", "dev", "deploy_configs.json");
const ESCALATIONS_PATH = path.join(PROJECT_ROOT, "shared", "escalations.json");

const PRODUCTION_ALIASES = ["producción", "produccion", "production", "prod"];

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf-8"));
  } catch (err) {
    if (err.code === "ENOENT") return fallback;
    throw err;
  }
}

async function writeEscalations(list) {
  await mkdir(path.dirname(ESCALATIONS_PATH), { recursive: true });
  await writeFile(ESCALATIONS_PATH, JSON.stringify(list, null, 2), "utf-8");
}

/**
 * Despliega un proyecto. El proveedor/comando se configura por proyecto en
 * shared/dev/deploy_configs.json. Si environment es producción, Volt NUNCA
 * ejecuta — congela y escala a CEO vía shared/escalations.json. Solo una
 * aprobación explícita (fuera de esta función, resolviendo la escalación)
 * habilita que alguien ejecute el deploy real.
 * @param {{ project: string, projectPath: string }} target
 * @param {string} environment
 * @returns {Promise<object>} resultado del deploy, o la escalación si era producción
 */
export async function deploy(target, environment) {
  if (!target || !target.project || !target.projectPath) {
    throw new Error("deploy: 'target.project' y 'target.projectPath' son obligatorios");
  }
  if (!environment) {
    throw new Error("deploy: 'environment' es obligatorio");
  }

  const isProduction = PRODUCTION_ALIASES.includes(environment.toLowerCase());

  if (isProduction) {
    const escalations = await readJson(ESCALATIONS_PATH, []);
    const escalation = {
      id: randomUUID(),
      title: `Deploy a producción pendiente de aprobación: ${target.project}`,
      description: `Volt detectó un pedido de deploy a producción para "${target.project}". No se ejecuta nada hasta tu aprobación explícita.`,
      context: JSON.stringify(target),
      raisedBy: "volt",
      status: "awaiting_ceo",
      createdAt: new Date().toISOString(),
      resolvedAt: null,
      ceoDecision: null,
      ceoNote: null,
    };
    escalations.push(escalation);
    await writeEscalations(escalations);
    return { executed: false, escalation };
  }

  const configs = await readJson(DEPLOY_CONFIGS_PATH, { projects: {} });
  const projectConfig = configs.projects[target.project];
  const command = projectConfig?.commands?.[environment];
  if (!command) {
    throw new Error(
      `deploy: no hay comando configurado para '${target.project}' en el ambiente '${environment}' — agregalo a shared/dev/deploy_configs.json`
    );
  }

  const result = await new Promise((resolve) => {
    exec(command, { cwd: target.projectPath, timeout: 180000 }, (error, stdout, stderr) => {
      resolve({ success: !error, exitCode: error?.code ?? 0, stdout, stderr });
    });
  });

  return { executed: true, environment, command, ...result, deployedAt: new Date().toISOString() };
}
