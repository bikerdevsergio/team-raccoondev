import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const ESCALATIONS_PATH = path.join(PROJECT_ROOT, "shared", "escalations.json");
const PAYROLL_DIR = path.join(PROJECT_ROOT, "shared", "finance", "payroll");

async function readEscalations() {
  try {
    return JSON.parse(await readFile(ESCALATIONS_PATH, "utf-8"));
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function writeEscalations(list) {
  await mkdir(path.dirname(ESCALATIONS_PATH), { recursive: true });
  await writeFile(ESCALATIONS_PATH, JSON.stringify(list, null, 2), "utf-8");
}

/**
 * Nómina mensual. Midas NO puede ejecutar transferencias bancarias reales
 * (no hay integración bancaria) — propone el pago en COP a Sergi y escala
 * para que confirmes explícitamente que se hizo. El plan de RaccoonCoins
 * para agentes queda guardado pero NO se distribuye todavía: eso depende
 * de raccoin_ledger() (función 16), que aún no existe.
 * @param {{ ceoPaymentCOP: number, agentCoinAwards: Array<{agent: string, amount: number}> }} payrollInput
 * @returns {Promise<object>} el registro de nómina creado
 */
export async function payroll(payrollInput) {
  if (!payrollInput || typeof payrollInput.ceoPaymentCOP !== "number" || payrollInput.ceoPaymentCOP <= 0) {
    throw new Error("payroll: 'ceoPaymentCOP' debe ser un número positivo");
  }
  if (!Array.isArray(payrollInput.agentCoinAwards)) {
    throw new Error("payroll: 'agentCoinAwards' es obligatorio (puede ser [])");
  }

  const record = {
    id: randomUUID(),
    ceoPaymentCOP: payrollInput.ceoPaymentCOP,
    status: "awaiting_ceo_confirmation",
    plannedCoinAwards: payrollInput.agentCoinAwards,
    coinsDistributed: false,
    createdAt: new Date().toISOString(),
  };

  await mkdir(PAYROLL_DIR, { recursive: true });
  await writeFile(path.join(PAYROLL_DIR, `${record.id}.json`), JSON.stringify(record, null, 2), "utf-8");

  const escalations = await readEscalations();
  const escalation = {
    id: randomUUID(),
    title: `Nómina mensual: confirmar pago de ${payrollInput.ceoPaymentCOP} COP a Sergi`,
    description: `Midas no puede transferir dinero real — confirmá manualmente cuando hagas la transferencia. Una vez confirmado, se habilita la distribución de RaccoonCoins planeada: ${JSON.stringify(payrollInput.agentCoinAwards)}.`,
    context: JSON.stringify({ payrollId: record.id }),
    raisedBy: "midas",
    status: "awaiting_ceo",
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    ceoDecision: null,
    ceoNote: null,
  };
  escalations.push(escalation);
  await writeEscalations(escalations);

  return { record, escalation };
}
