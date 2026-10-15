import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const INVOICES_DIR = path.join(PROJECT_ROOT, "shared", "finance", "invoices");
const INCOME_PATH = path.join(PROJECT_ROOT, "shared", "finance", "income.json");
const PORTFOLIO_PATH = path.join(PROJECT_ROOT, "shared", "finance", "portfolio.json");

async function readInvoices() {
  let files;
  try {
    files = await readdir(INVOICES_DIR);
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
  const invoices = [];
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    invoices.push(JSON.parse(await readFile(path.join(INVOICES_DIR, file), "utf-8")));
  }
  return invoices;
}

async function readIncome() {
  try {
    return JSON.parse(await readFile(INCOME_PATH, "utf-8"));
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

/**
 * Cartera de clientes: por cada clientId con factura emitida, cuánto se
 * facturó, cuánto pagó (según income.json, matcheado por clientId — no
 * por nombre) y la deuda pendiente. Guarda snapshot en
 * shared/finance/portfolio.json.
 * @returns {Promise<object>} la cartera generada
 */
export async function portfolioManager() {
  const [invoices, income] = await Promise.all([readInvoices(), readIncome()]);

  const clients = {};
  for (const inv of invoices) {
    if (!inv.clientId) continue;
    clients[inv.clientId] ??= {
      clientId: inv.clientId,
      clientName: inv.clientName,
      clientEmail: inv.clientEmail,
      totalInvoiced: 0,
      invoices: [],
    };
    clients[inv.clientId].totalInvoiced += inv.totalAmount;
    clients[inv.clientId].invoices.push({
      invoiceId: inv.invoiceId,
      amount: inv.totalAmount,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
    });
  }

  for (const client of Object.values(clients)) {
    const paidRecords = income.filter((i) => i.clientId === client.clientId);
    client.totalPaid = paidRecords.reduce((sum, i) => sum + i.amount, 0);
    client.pendingDebt = client.totalInvoiced - client.totalPaid;
    client.paymentHistory = paidRecords.map((i) => ({ amount: i.amount, date: i.createdAt }));
  }

  const portfolio = {
    currency: process.env.BASE_CURRENCY ?? "USD",
    clients: Object.values(clients),
    generatedAt: new Date().toISOString(),
  };

  await mkdir(path.dirname(PORTFOLIO_PATH), { recursive: true });
  await writeFile(PORTFOLIO_PATH, JSON.stringify(portfolio, null, 2), "utf-8");

  return portfolio;
}
