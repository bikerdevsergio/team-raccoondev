import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const CALENDAR_PATH = path.join(PROJECT_ROOT, "shared", "marketing", "content_calendar.json");

async function readCalendar() {
  try {
    return JSON.parse(await readFile(CALENDAR_PATH, "utf-8"));
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function writeCalendar(list) {
  await mkdir(path.dirname(CALENDAR_PATH), { recursive: true });
  await writeFile(CALENDAR_PATH, JSON.stringify(list, null, 2), "utf-8");
}

/**
 * Registra/consulta el calendario de contenido por canal y fecha. Si se
 * pasa newEntry, la agrega antes de devolver el calendario completo.
 * @param {{ channel: string, topic: string, scheduledDate: string, postId?: string }} [newEntry]
 * @returns {Promise<object>} { entries, upcoming, generatedAt }
 */
export async function contentCalendar(newEntry) {
  const entries = await readCalendar();

  if (newEntry) {
    if (!newEntry.channel || !newEntry.topic || !newEntry.scheduledDate) {
      throw new Error("content_calendar: 'channel', 'topic' y 'scheduledDate' son obligatorios");
    }
    if (isNaN(new Date(newEntry.scheduledDate))) {
      throw new Error("content_calendar: 'scheduledDate' debe ser una fecha ISO válida");
    }
    entries.push({
      id: randomUUID(),
      channel: newEntry.channel,
      topic: newEntry.topic,
      scheduledDate: new Date(newEntry.scheduledDate).toISOString(),
      postId: newEntry.postId ?? null,
      status: "planned",
      createdAt: new Date().toISOString(),
    });
    await writeCalendar(entries);
  }

  const sorted = [...entries].sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));

  const now = new Date();
  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const upcoming = sorted.filter(
    (e) => e.status === "planned" && new Date(e.scheduledDate) >= now && new Date(e.scheduledDate) <= sevenDaysFromNow
  );

  return { entries: sorted, upcoming, generatedAt: new Date().toISOString() };
}
