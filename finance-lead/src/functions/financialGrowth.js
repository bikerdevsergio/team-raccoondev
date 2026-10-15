import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const EXPENSES_PATH = path.join(PROJECT_ROOT, "shared", "finance", "expenses.json");
const INCOME_PATH = path.join(PROJECT_ROOT, "shared", "finance", "income.json");
const GROWTH_HISTORY_PATH = path.join(PROJECT_ROOT, "shared", "finance", "growth_history.json");

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf-8"));
  } catch (err) {
    if (err.code === "ENOENT") return fallback;
    throw err;
  }
}

/**
 * Mide el crecimiento financiero de RaccoonDev a través del colchón
 * acumulado (ingresos - gastos de todo el historial), comparado contra
 * el snapshot anterior. Guarda cada medición en growth_history.json.
 * @returns {Promise<object>} la medición generada
 */
export async function financialGrowth() {
  const [expenses, income, history] = await Promise.all([
    readJson(EXPENSES_PATH, []),
    readJson(INCOME_PATH, []),
    readJson(GROWTH_HISTORY_PATH, []),
  ]);

  const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const cumulativeNet = totalIncome - totalExpenses;

  const previous = history.length > 0 ? history[history.length - 1] : null;
  const previousNet = previous?.cumulativeNet ?? 0;
  const growthAmount = cumulativeNet - previousNet;
  const growthPercent = previousNet !== 0 ? (growthAmount / Math.abs(previousNet)) * 100 : null;

  const snapshot = {
    currency: process.env.BASE_CURRENCY ?? "USD",
    cumulativeNet,
    previousNet,
    growthAmount,
    growthPercent,
    generatedAt: new Date().toISOString(),
  };

  history.push(snapshot);
  await mkdir(path.dirname(GROWTH_HISTORY_PATH), { recursive: true });
  await writeFile(GROWTH_HISTORY_PATH, JSON.stringify(history, null, 2), "utf-8");

  return snapshot;
}
