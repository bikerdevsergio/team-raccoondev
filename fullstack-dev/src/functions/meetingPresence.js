import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient } from "../lib/anthropicClient.js";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const ESCALATIONS_PATH = path.join(PROJECT_ROOT, "shared", "escalations.json");

const TechnicalAnalysisSchema = z.object({
  hasTechnicalImplication: z.boolean(),
  summary: z.string().describe("Resumen breve de la implicación técnica detectada, o vacío si no hay"),
  shouldEscalate: z.boolean().describe("true si esto necesita atención del CEO, no solo quedar registrado"),
});

const SYSTEM_PROMPT = `Sos el módulo de Volt (CTO de RaccoonDev) que monitorea reuniones.
Recibís un fragmento de transcripción en español. Detectá si menciona algo con implicación
técnica real: features nuevas pedidas, bugs mencionados, cambios de alcance que afecten
arquitectura o esfuerzo de desarrollo, riesgos técnicos, plazos de entrega. Ignorá charla sin
relevancia técnica.`;

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
 * Analiza un fragmento de transcripción de reunión buscando implicaciones
 * técnicas. Si encuentra algo que necesita al CEO, lo comunica a Dante
 * escalando vía shared/escalations.json (sin llamada directa entre agentes).
 * @param {string} transcriptChunk
 * @returns {Promise<object>} el análisis, con la escalación si se generó
 */
export async function meetingPresence(transcriptChunk) {
  if (!transcriptChunk || !transcriptChunk.trim()) {
    throw new Error("meeting_presence: 'transcriptChunk' es obligatorio");
  }

  const client = getAnthropicClient();
  const response = await client.messages.parse({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: transcriptChunk }],
    output_config: { format: zodOutputFormat(TechnicalAnalysisSchema) },
  });

  if (!response.parsed_output) {
    throw new Error("meeting_presence: Claude no devolvió una salida estructurada válida");
  }

  const analysis = response.parsed_output;
  let escalation = null;

  if (analysis.hasTechnicalImplication && analysis.shouldEscalate) {
    const escalations = await readEscalations();
    escalation = {
      id: randomUUID(),
      title: "Implicación técnica detectada en reunión",
      description: analysis.summary,
      context: transcriptChunk,
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

  return { ...analysis, escalation };
}
