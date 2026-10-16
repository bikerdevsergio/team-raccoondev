import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getAnthropicClient } from "../lib/anthropicClient.js";
import { getNeo4jDriver } from "../lib/neo4jClient.js";
import { getTransporter } from "../lib/mailer.js";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const ESCALATIONS_PATH = path.join(PROJECT_ROOT, "shared", "escalations.json");

async function checkClaude() {
  let client;
  try {
    client = getAnthropicClient();
  } catch {
    return { service: "Claude API", status: "not_configured" };
  }
  try {
    await client.models.retrieve("claude-sonnet-4-6");
    return { service: "Claude API", status: "ok" };
  } catch (err) {
    return { service: "Claude API", status: "error", error: err.message };
  }
}

async function checkNeo4j() {
  let driver;
  try {
    driver = getNeo4jDriver();
  } catch {
    return { service: "Neo4j AuraDB", status: "not_configured" };
  }
  const session = driver.session();
  try {
    await session.run("RETURN 1");
    return { service: "Neo4j AuraDB", status: "ok" };
  } catch (err) {
    return { service: "Neo4j AuraDB", status: "error", error: err.message };
  } finally {
    await session.close();
  }
}

async function checkSmtp() {
  const transporter = getTransporter();
  if (!transporter) {
    return { service: "SMTP", status: "not_configured" };
  }
  try {
    await transporter.verify();
    return { service: "SMTP", status: "ok" };
  } catch (err) {
    return { service: "SMTP", status: "error", error: err.message };
  }
}

async function readEscalations() {
  try {
    return JSON.parse(await readFile(ESCALATIONS_PATH, "utf-8"));
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function writeEscalations(list) {
  await mkdir(path.dirname(ESCALATIONS_PATH), { recursive: true });
  await writeFile(ESCALATIONS_PATH, JSON.stringify(list, null, 2), "utf-8");
}

/**
 * Verifica que las APIs externas activas (Claude, Neo4j, SMTP) estén
 * respondiendo. Un servicio sin credenciales configuradas se reporta como
 * "not_configured" (no es una falla). Solo un servicio configurado que
 * falla genera una alerta escalada a CEO.
 * @returns {Promise<object>} el resultado del check
 */
export async function apiHealthCheck() {
  const results = await Promise.all([checkClaude(), checkNeo4j(), checkSmtp()]);
  const failures = results.filter((r) => r.status === "error");

  if (failures.length > 0) {
    const escalations = await readEscalations();
    const escalation = {
      id: randomUUID(),
      title: `Falla en servicios externos: ${failures.map((f) => f.service).join(", ")}`,
      description: failures.map((f) => `${f.service}: ${f.error}`).join(" | "),
      context: JSON.stringify(results),
      raisedBy: "volt",
      status: "awaiting_ceo",
      createdAt: new Date().toISOString(),
      resolvedAt: null,
      ceoDecision: null,
      ceoNote: null,
    };
    escalations.push(escalation);
    await writeEscalations(escalations);
  }

  return { results, checkedAt: new Date().toISOString() };
}
