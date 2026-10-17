import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient } from "../lib/anthropicClient.js";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const BRAND_VOICE_PATH = path.join(PROJECT_ROOT, "shared", "marketing", "config", "brand_voice.json");
const CHECKS_DIR = path.join(PROJECT_ROOT, "shared", "marketing", "brand_voice_checks");

const CheckSchema = z.object({
  matches: z.boolean(),
  issues: z.array(z.string()).describe("Problemas de tono detectados, vacío si no hay"),
  suggestion: z.string().describe("Sugerencia de reescritura si hay problemas, o vacío si está bien"),
});

/**
 * Revisa si un texto cumple el tono de marca de RaccoonDev (definido en
 * shared/marketing/config/brand_voice.json, editable a mano), vía Claude API.
 * @param {string} text
 * @returns {Promise<object>} el resultado del check
 */
export async function brandVoiceCheck(text) {
  if (!text || !text.trim()) {
    throw new Error("brand_voice_check: 'text' es obligatorio");
  }

  const brandVoice = JSON.parse(await readFile(BRAND_VOICE_PATH, "utf-8"));
  const systemPrompt = `Sos Hermes, Lead de Marketing de RaccoonDev. Evaluás si un texto cumple
el tono de marca definido: "${brandVoice.tone}". Palabras a evitar: ${brandVoice.avoidWords.join(", ")}.
Estilo preferido: ${brandVoice.preferredStyle}`;

  const client = getAnthropicClient();
  const response = await client.messages.parse({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    system: systemPrompt,
    messages: [{ role: "user", content: text }],
    output_config: { format: zodOutputFormat(CheckSchema) },
  });

  if (!response.parsed_output) {
    throw new Error("brand_voice_check: Claude no devolvió una salida estructurada válida");
  }

  const result = { id: randomUUID(), text, ...response.parsed_output, checkedAt: new Date().toISOString() };

  await mkdir(CHECKS_DIR, { recursive: true });
  await writeFile(path.join(CHECKS_DIR, `${result.id}.json`), JSON.stringify(result, null, 2), "utf-8");

  return result;
}
