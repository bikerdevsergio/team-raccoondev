import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mammoth from "mammoth";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient } from "../lib/anthropicClient.js";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const REVIEWS_DIR = path.join(PROJECT_ROOT, "shared", "legal", "contract_reviews");

const ReviewSchema = z.object({
  riskyClauses: z.array(z.object({
    clause: z.string().describe("Texto o referencia de la cláusula"),
    risk: z.string().describe("Por qué es riesgosa o desfavorable"),
    severity: z.enum(["low", "medium", "high"]),
  })),
  overallAssessment: z.string(),
});

const SYSTEM_PROMPT = `Sos Themis, Lead Legal de RaccoonDev, revisando un contrato recibido de un
cliente o proveedor. Buscá cláusulas riesgosas o desfavorables para RaccoonDev: responsabilidad
ilimitada, propiedad intelectual cedida sin contraprestación, plazos de pago desfavorables,
cláusulas de exclusividad abusivas, terminación unilateral, etc. No es asesoría legal definitiva
— es un primer filtro.`;

async function extractText(document) {
  if (typeof document === "string") {
    return document;
  }
  if (document?.text) {
    return document.text;
  }
  if (document?.filePath) {
    if (document.filePath.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ path: document.filePath });
      return result.value;
    }
    if (document.filePath.endsWith(".txt")) {
      return readFile(document.filePath, "utf-8");
    }
    throw new Error(
      "review_contract: solo se soportan .txt y .docx por ahora — leer .pdf requiere otra librería, es una decisión aparte"
    );
  }
  throw new Error("review_contract: se requiere texto o 'filePath' a un .txt/.docx");
}

/**
 * Revisa un contrato (texto plano, .txt o .docx) buscando cláusulas
 * riesgosas. NO soporta .pdf todavía — requeriría otra librería de
 * extracción, es una decisión aparte.
 * @param {string|{ text?: string, filePath?: string }} document
 * @returns {Promise<object>} la revisión generada
 */
export async function reviewContract(document) {
  const text = await extractText(document);

  if (!text || !text.trim()) {
    throw new Error("review_contract: el contrato está vacío");
  }

  const client = getAnthropicClient();
  const response = await client.messages.parse({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: text }],
    output_config: { format: zodOutputFormat(ReviewSchema) },
  });

  if (!response.parsed_output) {
    throw new Error("review_contract: Claude no devolvió una salida estructurada válida");
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
