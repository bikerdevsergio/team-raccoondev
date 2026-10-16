import { exec } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const RESULTS_DIR = path.join(PROJECT_ROOT, "shared", "test_results");

/**
 * Ejecuta la suite de tests de un proyecto/módulo y reporta el resultado.
 * @param {{ projectPath: string, command?: string, timeoutMs?: number }} target
 * @returns {Promise<object>} el resultado (pass/fail, salida, código de error)
 */
export async function runTests(target) {
  if (!target || !target.projectPath) {
    throw new Error("run_tests: 'target.projectPath' es obligatorio");
  }

  const command = target.command ?? "npm test";
  const timeoutMs = target.timeoutMs ?? 120000;

  const result = await new Promise((resolve) => {
    exec(command, { cwd: target.projectPath, timeout: timeoutMs }, (error, stdout, stderr) => {
      resolve({
        passed: !error,
        exitCode: error?.code ?? 0,
        stdout,
        stderr,
        timedOut: error?.killed && error?.signal === "SIGTERM",
      });
    });
  });

  const record = {
    id: randomUUID(),
    projectPath: target.projectPath,
    command,
    ...result,
    ranAt: new Date().toISOString(),
  };

  await mkdir(RESULTS_DIR, { recursive: true });
  await writeFile(path.join(RESULTS_DIR, `${record.id}.json`), JSON.stringify(record, null, 2), "utf-8");

  return record;
}
