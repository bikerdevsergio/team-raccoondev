import { exec } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const REPORT_PATH = path.join(PROJECT_ROOT, "shared", "dev", "dependency_audit.json");
const AGENT_DIRS = ["gg-raccoon", "finance-lead", "fullstack-dev", "legal-lead", "marketing-lead"];

async function hasPackageJson(agentDir) {
  try {
    await access(path.join(PROJECT_ROOT, agentDir, "package.json"));
    return true;
  } catch {
    return false;
  }
}

function runNpmAudit(cwd) {
  return new Promise((resolve) => {
    exec("npm audit --json", { cwd, timeout: 60000, maxBuffer: 10 * 1024 * 1024 }, (_error, stdout) => {
      try {
        const parsed = JSON.parse(stdout);
        resolve({ vulnerabilities: parsed.metadata?.vulnerabilities ?? {}, raw: parsed });
      } catch {
        resolve({ vulnerabilities: null, error: "no se pudo parsear la salida de npm audit" });
      }
    });
  });
}

/**
 * Escanea las dependencias de todos los agentes con npm audit y reporta
 * vulnerabilidades por agente. Guarda el reporte en shared/dev/dependency_audit.json.
 * @returns {Promise<object>} el reporte generado
 */
export async function dependencyAudit() {
  const results = {};

  for (const agentDir of AGENT_DIRS) {
    if (!(await hasPackageJson(agentDir))) {
      results[agentDir] = { skipped: true, reason: "sin package.json" };
      continue;
    }
    const auditResult = await runNpmAudit(path.join(PROJECT_ROOT, agentDir));
    results[agentDir] = auditResult;
  }

  const report = {
    agents: results,
    generatedAt: new Date().toISOString(),
  };

  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, JSON.stringify(report, null, 2), "utf-8");

  return report;
}
