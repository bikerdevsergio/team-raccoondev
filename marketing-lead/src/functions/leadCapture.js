import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const LEADS_PATH = path.join(PROJECT_ROOT, "shared", "marketing", "leads.json");

async function readLeads() {
  try {
    return JSON.parse(await readFile(LEADS_PATH, "utf-8"));
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function writeLeads(list) {
  await mkdir(path.dirname(LEADS_PATH), { recursive: true });
  await writeFile(LEADS_PATH, JSON.stringify(list, null, 2), "utf-8");
}

/**
 * Registra un lead entrante en el ledger compartido shared/marketing/leads.json.
 * @param {{ name: string, contact: string, source: string, interest?: string, notes?: string }} entry
 * @returns {Promise<object>} el registro creado
 */
export async function leadCapture(entry) {
  if (!entry || !entry.name || !entry.contact || !entry.source) {
    throw new Error("lead_capture: 'entry.name', 'entry.contact' y 'entry.source' son obligatorios");
  }

  const leads = await readLeads();
  const record = {
    id: randomUUID(),
    name: entry.name,
    contact: entry.contact,
    source: entry.source,
    interest: entry.interest ?? "",
    notes: entry.notes ?? "",
    status: "new",
    createdAt: new Date().toISOString(),
  };
  leads.push(record);
  await writeLeads(leads);

  return record;
}
