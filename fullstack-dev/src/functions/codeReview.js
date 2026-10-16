import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient } from "../lib/anthropicClient.js";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const REVIEWS_DIR = path.join(PROJECT_ROOT, "shared", "code_reviews");

const ReviewSchema = z.object({
  findings: z.array(z.object({
    file: z.string().describe("Archivo o 'desconocido' si no se puede determinar"),
    severity: z.enum(["low", "medium", "high"]),
    category: z.string().describe("ej: bug, seguridad, simplificación, eficiencia"),
    summary: z.string(),
  })),
  overallAssessment: z.string().describe("Resumen de 1-2 oraciones del estado general del diff"),
});

const SYSTEM_PROMPT = `Sos Volt, CTO de RaccoonDev, revisando un diff/PR. Buscá bugs reales,
problemas de seguridad (OWASP top 10) y oportunidades claras de simplificación o eficiencia.
No inventes problemas que no estén en el código. Si el diff está bien, decilo — no generes
findings artificiales para llenar la lista.`;

/**
 * Revisa un diff/PR vía Claude API buscando bugs, problemas de seguridad
 * y simplificaciones. Deja comentarios estructurados, no ejecuta cambios.
 * @param {{ diff: string, context?: string }} input
 * @returns {Promise<object>} la revisión generada
 */
export async function codeReview(input) {
  const diff = typeof input === "string" ? input : input?.diff;
  if (!diff || !diff.trim()) {
    throw new Error("code_review: 'diff' es obligatorio");
  }

  const client = getAnthropicClient();
  const userContent = typeof input === "object" && input.context
    ? `Contexto: ${input.context}\n\nDiff:\n${diff}`
    : diff;

  const response = await client.messages.parse({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userContent }],
    output_config: { format: zodOutputFormat(ReviewSchema) },
  });

  if (!response.parsed_output) {
    throw new Error("code_review: Claude no devolvió una salida estructurada válida");
  }

  const review = {
    id: randomUUID(),
    ...response.parsed_output,
    reviewedAt: new Date().toISOString(),
  };

  await mkdir(REVIEWS_DIR, { recursive: true });
  await writeFile(path.join(REVIEWS_DIR, `${review.id}.json`), JSON.stringify(review, null, 2), "utf-8");

  return review;
}
