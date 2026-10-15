import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const SERVICES_CONFIG_PATH = path.join(PROJECT_ROOT, "shared", "finance", "config", "services.json");
const SNAPSHOT_PATH = path.join(PROJECT_ROOT, "shared", "finance", "service_inventory.json");

/**
 * Lee el inventario de servicios activos (shared/finance/config/services.json,
 * editable a mano), calcula el costo mensual total y marca alertas para los
 * servicios que superan su alertThreshold configurado.
 * @returns {Promise<object>} el snapshot generado
 */
export async function serviceInventory() {
  let config;
  try {
    config = JSON.parse(await readFile(SERVICES_CONFIG_PATH, "utf-8"));
  } catch (err) {
    if (err.code === "ENOENT") {
      throw new Error("service_inventory: falta shared/finance/config/services.json");
    }
    throw err;
  }

  const services = config.services ?? [];
  const totalMonthlyCost = services.reduce((sum, s) => sum + (s.monthlyCost ?? 0), 0);
  const alerts = services
    .filter((s) => typeof s.alertThreshold === "number" && s.monthlyCost > s.alertThreshold)
    .map((s) => `${s.name}: ${s.monthlyCost} supera el umbral de ${s.alertThreshold}`);

  const snapshot = {
    currency: process.env.BASE_CURRENCY ?? "USD",
    services,
    totalMonthlyCost,
    alerts,
    generatedAt: new Date().toISOString(),
  };

  await mkdir(path.dirname(SNAPSHOT_PATH), { recursive: true });
  await writeFile(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2), "utf-8");

  return snapshot;
}
