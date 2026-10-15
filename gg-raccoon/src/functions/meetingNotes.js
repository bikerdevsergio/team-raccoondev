import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient } from "../lib/anthropicClient.js";
import { devlogWriter } from "./devlogWriter.js";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const NOTES_DIR = path.join(PROJECT_ROOT, "shared", "meeting_notes");

const MeetingAnalysisSchema = z.object({
  requirements: z.array(z.string()).describe("Requisitos o acciones concretas mencionadas"),
  risks: z.array(z.string()).describe("Riesgos o problemas potenciales detectados"),
  implicit: z.array(z.string()).describe("Cosas que quedaron implícitas o sin decir explícitamente pero se infieren del contexto"),
  followUpQuestions: z.array(z.string()).describe("Preguntas de seguimiento que el equipo debería responder"),
});

const SYSTEM_PROMPT = `Sos el asistente de análisis de reuniones de Dante, el Gerente General de RaccoonDev.
Recibís la transcripción completa de una reunión en español. Tu trabajo es analizarla y extraer:
- requirements: requisitos o acciones concretas que se mencionaron
- risks: riesgos, bloqueos o problemas potenciales que se puedan inferir
- implicit: cosas que el equipo dio por sentado o no dijo explícitamente pero que importan
- followUpQuestions: preguntas de seguimiento necesarias para que no quede nada ambiguo (responsable, fecha, alcance)
Sé preciso y concreto. No inventes información que no esté en la transcripción.`;

/**
 * MODO 1 — Post-reunión. Recibe la transcripción completa como texto,
 * la procesa con Claude API (salida estructurada) y guarda el resultado.
 * @param {{ transcript: string, source?: string }} input
 * @returns {Promise<object>} el registro de notas creado
 */
export async function meetingNotes(input) {
  if (!input || typeof input.transcript !== "string" || !input.transcript.trim()) {
    throw new Error("meeting_notes: 'input.transcript' es obligatorio");
  }

  const client = getAnthropicClient();

  const response = await client.messages.parse({
    model: "claude-sonnet-4-6",
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: input.transcript }],
    output_config: {
      format: zodOutputFormat(MeetingAnalysisSchema),
    },
  });

  if (!response.parsed_output) {
    throw new Error("meeting_notes: Claude no devolvió una salida estructurada válida");
  }

  const record = {
    id: randomUUID(),
    source: input.source ?? "unknown",
    transcript: input.transcript,
    ...response.parsed_output,
    createdAt: new Date().toISOString(),
  };

  await mkdir(NOTES_DIR, { recursive: true });
  const filePath = path.join(NOTES_DIR, `${record.id}.json`);
  await writeFile(filePath, JSON.stringify(record, null, 2), "utf-8");

  await devlogWriter({
    title: `Notas de reunión procesadas (${record.source})`,
    author: "dante",
    details: [
      `${record.requirements.length} requisito(s)`,
      `${record.risks.length} riesgo(s)`,
      `${record.implicit.length} implícito(s)`,
      `${record.followUpQuestions.length} pregunta(s) de seguimiento`,
    ],
  });

  return record;
}
