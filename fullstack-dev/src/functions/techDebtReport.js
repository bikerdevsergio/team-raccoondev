import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const TECH_DEBT_PATH = path.join(PROJECT_ROOT, "shared", "tech_debt.json");

async function readTechDebt() {
  try {
    return JSON.parse(await readFile(TECH_DEBT_PATH, "utf-8"));
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function writeTechDebt(list) {
  await mkdir(path.dirname(TECH_DEBT_PATH), { recursive: true });
  await writeFile(TECH_DEBT_PATH, JSON.stringify(list, null, 2), "utf-8");
}

/**
 * Compila el reporte de deuda técnica pendiente across proyectos. Si se
 * pasa newEntry, la agrega al ledger antes de generar el reporte.
 * @param {{ project: string, description: string, estimatedEffort?: string }} [newEntry]
 * @returns {Promise<object>} el reporte generado
 */
export async function techDebtReport(newEntry) {
  const items = await readTechDebt();

  if (newEntry) {
    if (!newEntry.project || !newEntry.description) {
      throw new Error("tech_debt_report: 'newEntry.project' y 'newEntry.description' son obligatorios");
    }
    items.push({
      id: randomUUID(),
      project: newEntry.project,
      description: newEntry.description,
      estimatedEffort: newEntry.estimatedEffort ?? null,
      status: "open",
      createdAt: new Date().toISOString(),
    });
    await writeTechDebt(items);
  }

  const openItems = items.filter((i) => i.status === "open");
  const byProject = {};
  for (const item of openItems) {
    byProject[item.project] ??= [];
    byProject[item.project].push({ id: item.id, description: item.description, estimatedEffort: item.estimatedEffort });
  }

  return {
    totalOpen: openItems.length,
    byProject,
    generatedAt: new Date().toISOString(),
  };
}
