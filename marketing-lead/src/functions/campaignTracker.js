import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const CAMPAIGNS_PATH = path.join(PROJECT_ROOT, "shared", "marketing", "campaigns.json");
const EXPENSES_PATH = path.join(PROJECT_ROOT, "shared", "finance", "expenses.json");

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf-8"));
  } catch (err) {
    if (err.code === "ENOENT") return fallback;
    throw err;
  }
}

async function writeJson(filePath, data) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Registra una campaña activa (presupuesto, canal, resultados). El
 * presupuesto se registra también en shared/finance/expenses.json (mismo
 * formato que track_expense de Midas) para que aparezca en budget_report
 * sin llamar directo al código de Midas.
 * @param {{ name: string, channel: string, budget: number, startDate: string, endDate?: string, results?: object }} entry
 * @returns {Promise<object>} la campaña registrada
 */
export async function campaignTracker(entry) {
  if (!entry || !entry.name || !entry.channel || typeof entry.budget !== "number") {
    throw new Error("campaign_tracker: 'entry.name', 'entry.channel' y 'entry.budget' son obligatorios");
  }

  const campaigns = await readJson(CAMPAIGNS_PATH, []);
  const campaign = {
    id: randomUUID(),
    name: entry.name,
    channel: entry.channel,
    budget: entry.budget,
    startDate: entry.startDate ?? new Date().toISOString(),
    endDate: entry.endDate ?? null,
    results: entry.results ?? null,
    status: "active",
    createdAt: new Date().toISOString(),
  };
  campaigns.push(campaign);
  await writeJson(CAMPAIGNS_PATH, campaigns);

  if (entry.budget > 0) {
    const expenses = await readJson(EXPENSES_PATH, []);
    expenses.push({
      id: randomUUID(),
      amount: entry.budget,
      category: "marketing-campaña",
      description: `Campaña: ${entry.name} (${entry.channel})`,
      project: entry.name,
      createdBy: "hermes",
      createdAt: new Date().toISOString(),
    });
    await writeJson(EXPENSES_PATH, expenses);
  }

  return campaign;
}
