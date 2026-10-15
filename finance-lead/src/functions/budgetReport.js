import { readFile } from "node:fs/promises";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const EXPENSES_PATH = path.join(PROJECT_ROOT, "shared", "finance", "expenses.json");
const INCOME_PATH = path.join(PROJECT_ROOT, "shared", "finance", "income.json");
const REPORTS_DIR = path.join(PROJECT_ROOT, "shared", "finance", "reports");

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

function groupByKey(records, key) {
  const groups = {};
  for (const r of records) {
    groups[r[key]] = (groups[r[key]] ?? 0) + r.amount;
  }
  return groups;
}

/**
 * Reporte de ingresos vs gastos por período, agrupado por categoría/fuente.
 * @param {{ from: string, to: string }} period — fechas ISO
 * @returns {Promise<object>} el reporte generado
 */
export async function budgetReport(period) {
  if (!period || !period.from || !period.to) {
    throw new Error("budget_report: 'period.from' y 'period.to' son obligatorios (fechas ISO)");
  }

  const from = new Date(period.from);
  const to = new Date(period.to);
  if (isNaN(from) || isNaN(to) || from > to) {
    throw new Error("budget_report: período inválido");
  }

  const [allExpenses, allIncome] = await Promise.all([
    readLedger(EXPENSES_PATH),
    readLedger(INCOME_PATH),
  ]);

  const expenses = allExpenses.filter((e) => inPeriod(e, from, to));
  const income = allIncome.filter((i) => inPeriod(i, from, to));

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);

  const report = {
    id: randomUUID(),
    period: { from: from.toISOString(), to: to.toISOString() },
    totalIncome,
    totalExpenses,
    net: totalIncome - totalExpenses,
    expensesByCategory: groupByKey(expenses, "category"),
    incomeBySource: groupByKey(income, "source"),
    generatedAt: new Date().toISOString(),
  };

  await mkdir(REPORTS_DIR, { recursive: true });
  await writeFile(path.join(REPORTS_DIR, `${report.id}.json`), JSON.stringify(report, null, 2), "utf-8");

  return report;
}
