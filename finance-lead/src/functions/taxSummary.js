import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const EXPENSES_PATH = path.join(PROJECT_ROOT, "shared", "finance", "expenses.json");
const INCOME_PATH = path.join(PROJECT_ROOT, "shared", "finance", "income.json");
const TAX_DIR = path.join(PROJECT_ROOT, "shared", "finance", "tax_summaries");

async function readLedger(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf-8"));
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

function inPeriod(record, from, to) {
  const date = new Date(record.createdAt);
  return date >= from && date <= to;
}

function groupByCategory(records) {
  const groups = {};
  for (const r of records) {
    groups[r.category] = (groups[r.category] ?? 0) + r.amount;
  }
  return groups;
}

/**
 * Resumen para contador/impuestos de un período: ingreso total, gasto
 * deducible por categoría, y base imponible estimada (ingreso - deducible).
 * No determina qué es deducible según normativa — asume todos los gastos
 * registrados como deducibles; el contador ajusta desde ahí.
 * @param {{ from: string, to: string }} period — fechas ISO
 * @returns {Promise<object>} el resumen generado
 */
export async function taxSummary(period) {
  if (!period || !period.from || !period.to) {
    throw new Error("tax_summary: 'period.from' y 'period.to' son obligatorios (fechas ISO)");
  }

  const from = new Date(period.from);
  const to = new Date(period.to);
  if (isNaN(from) || isNaN(to) || from > to) {
    throw new Error("tax_summary: período inválido");
  }

  const [allExpenses, allIncome] = await Promise.all([
    readLedger(EXPENSES_PATH),
    readLedger(INCOME_PATH),
  ]);

  const expenses = allExpenses.filter((e) => inPeriod(e, from, to));
  const income = allIncome.filter((i) => inPeriod(i, from, to));

  const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
  const totalDeductibleExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const summary = {
    id: randomUUID(),
    period: { from: from.toISOString(), to: to.toISOString() },
    currency: process.env.BASE_CURRENCY ?? "USD",
    totalIncome,
    totalDeductibleExpenses,
    estimatedTaxableIncome: totalIncome - totalDeductibleExpenses,
    expensesByCategory: groupByCategory(expenses),
    transactionCount: { income: income.length, expenses: expenses.length },
    generatedAt: new Date().toISOString(),
    note: "Gastos asumidos como deducibles en su totalidad — requiere revisión del contador según normativa vigente.",
  };

  await mkdir(TAX_DIR, { recursive: true });
  await writeFile(path.join(TAX_DIR, `${summary.id}.json`), JSON.stringify(summary, null, 2), "utf-8");

  return summary;
}
