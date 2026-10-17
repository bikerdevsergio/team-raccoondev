import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const IP_WATCH_PATH = path.join(PROJECT_ROOT, "shared", "legal", "ip_watch.json");

const VALID_TYPES = ["marca", "dominio", "derecho de autor", "patente", "otro"];

async function readIpWatch() {
  try {
    return JSON.parse(await readFile(IP_WATCH_PATH, "utf-8"));
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function writeIpWatch(list) {
  await mkdir(path.dirname(IP_WATCH_PATH), { recursive: true });
  await writeFile(IP_WATCH_PATH, JSON.stringify(list, null, 2), "utf-8");
}

/**
 * Registra una marca/propiedad intelectual a vigilar en shared/legal/ip_watch.json.
 * @param {{ name: string, type: string, jurisdiction?: string, renewalDate?: string, notes?: string }} entry
 * @returns {Promise<object>} el registro creado
 */
export async function ipWatch(entry) {
  if (!entry || !entry.name || !entry.type) {
    throw new Error("ip_watch: 'entry.name' y 'entry.type' son obligatorios");
  }
  if (!VALID_TYPES.includes(entry.type)) {
    throw new Error(`ip_watch: 'entry.type' debe ser uno de: ${VALID_TYPES.join(", ")}`);
  }

  const items = await readIpWatch();
  const record = {
    id: randomUUID(),
    name: entry.name,
    type: entry.type,
    jurisdiction: entry.jurisdiction ?? null,
    renewalDate: entry.renewalDate ?? null,
    notes: entry.notes ?? "",
    status: "active",
    createdAt: new Date().toISOString(),
  };
  items.push(record);
  await writeIpWatch(items);

  return record;
}
