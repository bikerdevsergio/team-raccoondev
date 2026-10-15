import { appendFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../"
);
const DEVLOG_PATH = path.join(PROJECT_ROOT, "DEVLOG.md");

/**
 * Agrega una entrada estructurada al DEVLOG.md raíz.
 * @param {{ title: string, details?: string[], reason?: string, author?: string, date?: Date }} entry
 * @returns {Promise<{ path: string, heading: string }>}
 */
export async function devlogWriter(entry) {
  if (!entry || typeof entry.title !== "string" || !entry.title.trim()) {
    throw new Error("devlog_writer: 'entry.title' es obligatorio");
  }

  const date = entry.date instanceof Date ? entry.date : new Date();
  const isoDate = date.toISOString().slice(0, 10);
  const author = entry.author ?? "dante";
  const heading = `## ${isoDate} — ${entry.title}`;

  const lines = [`\n${heading}\n`, `- **Autor:** ${author}`];

  if (Array.isArray(entry.details) && entry.details.length > 0) {
    for (const detail of entry.details) {
      lines.push(`- ${detail}`);
    }
  }
  if (entry.reason) {
    lines.push(`- **Razón:** ${entry.reason}`);
  }

  const block = lines.join("\n") + "\n";
  await appendFile(DEVLOG_PATH, block, "utf-8");

  return { path: DEVLOG_PATH, heading };
}
