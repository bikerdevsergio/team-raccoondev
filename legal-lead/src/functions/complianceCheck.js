import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient } from "../lib/anthropicClient.js";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const CHECKS_DIR = path.join(PROJECT_ROOT, "shared", "legal", "compliance_checks");
const ESCALATIONS_PATH = path.join(PROJECT_ROOT, "shared", "escalations.json");

const ComplianceSchema = z.object({
  compliant: z.boolean(),
  risks: z.array(z.object({
    issue: z.string(),
    severity: z.enum(["low", "medium", "high"]),
    recommendation: z.string(),
  })),
  summary: z.string(),
});

const SYSTEM_PROMPT = `Sos Themis, Lead Legal de RaccoonDev. Evaluás si el flujo de datos de un
proyecto cumple lineamientos básicos de privacidad: GDPR (si aplica a usuarios europeos) y la
Ley 1581 de 2012 de Colombia (Habeas Data) — consentimiento informado, finalidad, proporcionalidad,
derechos de acceso/rectificación/supresión, seguridad, transferencia internacional de datos.
No es asesoría legal definitiva — es un primer filtro de riesgo.`;

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
 * Verifica el flujo de datos de un proyecto contra lineamientos básicos de
 * privacidad (GDPR / Habeas Data Colombia). Si encuentra un riesgo "high",
 * lo escala automáticamente a CEO vía shared/escalations.json.
 * @param {{ project: string, dataCollected: string[], purpose: string, thirdPartySharing?: boolean, retentionPeriod?: string, storageLocation?: string }} data
 * @returns {Promise<object>} el resultado del check
 */
export async function complianceCheck(data) {
  if (!data || !data.project || !Array.isArray(data.dataCollected) || !data.purpose) {
    throw new Error("compliance_check: 'data.project', 'data.dataCollected' y 'data.purpose' son obligatorios");
  }

  const client = getAnthropicClient();
  const userMessage = `Proyecto: ${data.project}
Datos recolectados: ${data.dataCollected.join(", ")}
Finalidad: ${data.purpose}
¿Se comparte con terceros?: ${data.thirdPartySharing ? "sí" : "no"}
Período de retención: ${data.retentionPeriod ?? "no especificado"}
Ubicación de almacenamiento: ${data.storageLocation ?? "no especificada"}`;

  const response = await client.messages.parse({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
    output_config: { format: zodOutputFormat(ComplianceSchema) },
  });

  if (!response.parsed_output) {
    throw new Error("compliance_check: Claude no devolvió una salida estructurada válida");
  }

  const result = {
    id: randomUUID(),
    project: data.project,
    ...response.parsed_output,
    checkedAt: new Date().toISOString(),
  };

  await mkdir(CHECKS_DIR, { recursive: true });
  await writeFile(path.join(CHECKS_DIR, `${result.id}.json`), JSON.stringify(result, null, 2), "utf-8");

  const highRisks = result.risks.filter((r) => r.severity === "high");
  if (highRisks.length > 0) {
    const escalations = await readEscalations();
    const escalation = {
      id: randomUUID(),
      title: `Riesgo de cumplimiento alto detectado: ${data.project}`,
      description: highRisks.map((r) => `${r.issue} → ${r.recommendation}`).join(" | "),
      context: JSON.stringify(result),
      raisedBy: "themis",
      status: "awaiting_ceo",
      createdAt: new Date().toISOString(),
      resolvedAt: null,
      ceoDecision: null,
      ceoNote: null,
    };
    escalations.push(escalation);
    await writeEscalations(escalations);
    result.escalation = escalation;
  }

  return result;
}
