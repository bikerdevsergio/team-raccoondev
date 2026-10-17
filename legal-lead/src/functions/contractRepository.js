import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const CONTRACTS_PATH = path.join(PROJECT_ROOT, "shared", "legal", "contracts", "index.json");

const VALID_STATUSES = ["draft", "active", "expired", "terminated"];

async function readContracts() {
  try {
    return JSON.parse(await readFile(CONTRACTS_PATH, "utf-8"));
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function writeContracts(list) {
  await mkdir(path.dirname(CONTRACTS_PATH), { recursive: true });
  await writeFile(CONTRACTS_PATH, JSON.stringify(list, null, 2), "utf-8");
}

/**
 * Índice de contratos activos: partes, estado, vencimiento. Si se pasa
 * newContract, lo agrega al índice antes de devolver el listado completo.
 * @param {{ clientName: string, type: string, parties: string[], status: string, startDate: string, endDate?: string, documentId?: string }} [newContract]
 * @returns {Promise<object>} { contracts, expiringSoon, byStatus, generatedAt }
 */
export async function contractRepository(newContract) {
  const contracts = await readContracts();

  if (newContract) {
    if (!newContract.clientName || !newContract.type || !Array.isArray(newContract.parties) || !newContract.status || !newContract.startDate) {
      throw new Error(
        "contract_repository: 'clientName', 'type', 'parties', 'status' y 'startDate' son obligatorios"
      );
    }
    if (!VALID_STATUSES.includes(newContract.status)) {
      throw new Error(`contract_repository: 'status' debe ser uno de: ${VALID_STATUSES.join(", ")}`);
    }
    contracts.push({
      id: randomUUID(),
      clientName: newContract.clientName,
      type: newContract.type,
      parties: newContract.parties,
      status: newContract.status,
      startDate: newContract.startDate,
      endDate: newContract.endDate ?? null,
      documentId: newContract.documentId ?? null,
      createdAt: new Date().toISOString(),
    });
    await writeContracts(contracts);
  }

  const now = new Date();
  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const expiringSoon = contracts.filter(
    (c) => c.status === "active" && c.endDate && new Date(c.endDate) <= thirtyDaysFromNow && new Date(c.endDate) >= now
  );

  const byStatus = {};
  for (const c of contracts) {
    byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
  }

  return {
    contracts,
    expiringSoon: expiringSoon.map((c) => ({ id: c.id, clientName: c.clientName, endDate: c.endDate })),
    byStatus,
    generatedAt: new Date().toISOString(),
  };
}
