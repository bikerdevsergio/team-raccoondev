import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const ESTIMATES_DIR = path.join(PROJECT_ROOT, "shared", "finance", "cost_estimates");
const RATES_PATH = path.join(PROJECT_ROOT, "shared", "finance", "config", "rates.json");

async function readRates() {
  try {
    const rates = JSON.parse(await readFile(RATES_PATH, "utf-8"));
    delete rates._comment;
    return rates;
  } catch (err) {
    if (err.code === "ENOENT") return {};
    throw err;
  }
}

/**
 * Proyecta el costo real de un proyecto antes de cotizarlo al cliente:
 * costo de mano de obra (horas × tarifa por rol) + costos fijos (APIs,
 * hosting, etc.), y un precio sugerido según margen deseado. Si una entrada
 * de laborHours no trae hourlyRate, se busca en shared/finance/config/rates.json.
 * @param {{
 *   name: string,
 *   laborHours: Array<{ role: string, hours: number, hourlyRate?: number }>,
 *   fixedCosts?: Array<{ description: string, amount: number }>,
 *   marginPercent?: number
 * }} project
 * @returns {Promise<object>} la estimación generada
 */
export async function projectCostEstimate(project) {
  if (!project || !project.name || !Array.isArray(project.laborHours)) {
    throw new Error("project_cost_estimate: 'project.name' y 'project.laborHours' son obligatorios");
  }

  const rates = await readRates();
  const resolvedLaborHours = project.laborHours.map((l) => {
    const hourlyRate = l.hourlyRate ?? rates[l.role];
    if (typeof hourlyRate !== "number") {
      throw new Error(
        `project_cost_estimate: no hay tarifa para el rol '${l.role}' — agregala a shared/finance/config/rates.json o especificá 'hourlyRate' explícito`
      );
    }
    return { ...l, hourlyRate };
  });

  const laborCost = resolvedLaborHours.reduce((sum, l) => sum + l.hours * l.hourlyRate, 0);
  const fixedCosts = project.fixedCosts ?? [];
  const fixedCost = fixedCosts.reduce((sum, f) => sum + f.amount, 0);
  const totalCost = laborCost + fixedCost;

  const margin = project.marginPercent ?? 0;
  if (margin < 0 || margin >= 100) {
    throw new Error("project_cost_estimate: 'marginPercent' debe estar entre 0 y 99");
  }
  const suggestedPrice = margin > 0 ? totalCost / (1 - margin / 100) : totalCost;

  const estimate = {
    id: randomUUID(),
    projectName: project.name,
    currency: process.env.BASE_CURRENCY ?? "USD",
    laborCost,
    fixedCost,
    totalCost,
    marginPercent: margin,
    suggestedPrice: Math.round(suggestedPrice * 100) / 100,
    breakdown: { laborHours: resolvedLaborHours, fixedCosts },
    generatedAt: new Date().toISOString(),
  };

  await mkdir(ESTIMATES_DIR, { recursive: true });
  await writeFile(path.join(ESTIMATES_DIR, `${estimate.id}.json`), JSON.stringify(estimate, null, 2), "utf-8");

  return estimate;
}
