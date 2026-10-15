import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const LEDGER_PATH = path.join(PROJECT_ROOT, "shared", "finance", "raccoin_ledger.json");

async function readLedger() {
  try {
    return JSON.parse(await readFile(LEDGER_PATH, "utf-8"));
  } catch (err) {
    if (err.code === "ENOENT") return { balances: {}, transactions: [] };
    throw err;
  }
}

async function writeLedger(ledger) {
  await mkdir(path.dirname(LEDGER_PATH), { recursive: true });
  await writeFile(LEDGER_PATH, JSON.stringify(ledger, null, 2), "utf-8");
}

/**
 * RaccoonCoins: moneda virtual interna, SIN valor monetario real y SIN
 * conversión a dinero. Los agentes las acumulan y las usan únicamente
 * para personalizar su moto en la PWA. amount puede ser negativo (gasto
 * en personalización), pero nunca resulta en un balance negativo.
 * @param {string} agent
 * @param {number} amount — positivo para acreditar, negativo para gastar
 * @param {string} [reason]
 * @returns {Promise<{ agent: string, balance: number }>}
 */
export async function raccoinLedger(agent, amount, reason) {
  if (!agent) {
    throw new Error("raccoin_ledger: 'agent' es obligatorio");
  }
  if (typeof amount !== "number" || amount === 0) {
    throw new Error("raccoin_ledger: 'amount' debe ser un número distinto de 0");
  }

  const ledger = await readLedger();
  const currentBalance = ledger.balances[agent] ?? 0;
  const newBalance = currentBalance + amount;

  if (newBalance < 0) {
    throw new Error(`raccoin_ledger: '${agent}' no tiene suficientes RaccoonCoins (balance: ${currentBalance}, intento: ${amount})`);
  }

  ledger.balances[agent] = newBalance;
  ledger.transactions.push({
    id: randomUUID(),
    agent,
    amount,
    reason: reason ?? null,
    balanceAfter: newBalance,
    createdAt: new Date().toISOString(),
  });

  await writeLedger(ledger);

  return { agent, balance: newBalance };
}
