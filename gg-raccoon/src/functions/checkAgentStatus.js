import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../"
);
const STATUS_DIR = path.join(PROJECT_ROOT, "shared", "status");

const AGENTS = ["gg-raccoon", "finance-lead", "fullstack-dev", "legal-lead", "marketing-lead"];

/**
 * Lee el archivo de estado JSON compartido de cada agente.
 * Un agente sin archivo de estado (todavía no construido/arrancado) se reporta como "unknown".
 * @returns {Promise<Array<{ agent: string, state: string, currentTask: string|null, lastUpdated: string|null }>>}
 */
export async function checkAgentStatus() {
  const results = [];

  for (const agent of AGENTS) {
    const filePath = path.join(STATUS_DIR, `${agent}.json`);
    try {
      const raw = await readFile(filePath, "utf-8");
      const data = JSON.parse(raw);
      results.push({
        agent,
        state: data.state ?? "unknown",
        currentTask: data.currentTask ?? null,
        lastUpdated: data.lastUpdated ?? null,
      });
    } catch (err) {
      if (err.code === "ENOENT") {
        results.push({ agent, state: "unknown", currentTask: null, lastUpdated: null });
      } else {
        results.push({ agent, state: "error", currentTask: null, lastUpdated: null, error: err.message });
      }
    }
  }

  return results;
}
