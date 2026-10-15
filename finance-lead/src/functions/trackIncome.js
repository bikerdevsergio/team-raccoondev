import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const INCOME_PATH = path.join(PROJECT_ROOT, "shared", "finance", "income.json");

async function readIncome() {
  try {
    return JSON.parse(await readFile(INCOME_PATH, "utf-8"));
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function writeIncome(list) {
  await mkdir(path.dirname(INCOME_PATH), { recursive: true });
  await writeFile(INCOME_PATH, JSON.stringify(list, null, 2), "utf-8");
}

/**
 * Registra un ingreso en el ledger compartido shared/finance/income.json.
 * @param {{ amount: number, source: string, clientId: string, description?: string, project?: string, createdBy: string }} entry
 * @returns {Promise<object>} el registro creado
 */
export async function trackIncome(entry) {
  if (!entry || typeof entry.amount !== "number" || entry.amount <= 0) {
    throw new Error("track_income: 'entry.amount' debe ser un número positivo");
  }
  if (!entry.source) {
    throw new Error("track_income: 'entry.source' es obligatorio");
  }
  if (!entry.clientId) {
    throw new Error("track_income: 'entry.clientId' es obligatorio");
  }
  if (!entry.createdBy) {
    throw new Error("track_income: 'entry.createdBy' es obligatorio");
  }

  const income = await readIncome();
  const record = {
    id: randomUUID(),
    amount: entry.amount,
    source: entry.source,
    clientId: entry.clientId,
    description: entry.description ?? "",
    project: entry.project ?? null,
    createdBy: entry.createdBy,
    createdAt: new Date().toISOString(),
  };
  income.push(record);
  await writeIncome(income);

  return record;
}
