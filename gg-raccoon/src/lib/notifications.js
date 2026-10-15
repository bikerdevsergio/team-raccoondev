import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const NOTIFICATIONS_PATH = path.join(PROJECT_ROOT, "shared", "notifications.json");

/**
 * Cola de notificaciones para la futura PWA. Hoy nadie la lee (la PWA no existe
 * todavía); cuando se construya, simplemente consume este JSON y las marca leídas.
 * @param {{ agent: string, type: string, title: string, message: string }} notification
 */
export async function pushNotification(notification) {
  let list = [];
  try {
    list = JSON.parse(await readFile(NOTIFICATIONS_PATH, "utf-8"));
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }

  const item = {
    id: randomUUID(),
    agent: notification.agent,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    read: false,
    createdAt: new Date().toISOString(),
  };
  list.push(item);

  await mkdir(path.dirname(NOTIFICATIONS_PATH), { recursive: true });
  await writeFile(NOTIFICATIONS_PATH, JSON.stringify(list, null, 2), "utf-8");
  return item;
}
