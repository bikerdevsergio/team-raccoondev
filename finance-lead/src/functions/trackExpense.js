import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const EXPENSES_PATH = path.join(PROJECT_ROOT, "shared", "finance", "expenses.json");

async function readExpenses() {
  try {
    return JSON.parse(await readFile(EXPENSES_PATH, "utf-8"));
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function writeExpenses(list) {
  await mkdir(path.dirname(EXPENSES_PATH), { recursive: true });
  await writeFile(EXPENSES_PATH, JSON.stringify(list, null, 2), "utf-8");
}

/**
 * Registra un gasto en el ledger compartido shared/finance/expenses.json.
 * @param {{ amount: number, category: string, description?: string, project?: string, createdBy: string }} entry
 * @returns {Promise<object>} el registro creado
 */
export async function trackExpense(entry) {
  if (!entry || typeof entry.amount !== "number" || entry.amount <= 0) {
    throw new Error("track_expense: 'entry.amount' debe ser un número positivo");
  }
  if (!entry.category) {
    throw new Error("track_expense: 'entry.category' es obligatorio");
  }
  if (!entry.createdBy) {
    throw new Error("track_expense: 'entry.createdBy' es obligatorio");
  }

  const expenses = await readExpenses();
  const record = {
    id: randomUUID(),
    amount: entry.amount,
    category: entry.category,
    description: entry.description ?? "",
    project: entry.project ?? null,
    createdBy: entry.createdBy,
    createdAt: new Date().toISOString(),
  };
  expenses.push(record);
  await writeExpenses(expenses);

  return record;
}
