import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getAnthropicClient } from "../lib/anthropicClient.js";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const POSTS_DIR = path.join(PROJECT_ROOT, "shared", "marketing", "posts");

const CHANNEL_GUIDELINES = {
  instagram: "Caption corto (hasta 150 palabras), tono cercano, con 3-5 hashtags relevantes al final.",
  linkedin: "Tono profesional pero humano, hasta 250 palabras, sin hashtags excesivos (máximo 3).",
  twitter: "Máximo 280 caracteres, directo, sin relleno.",
  blog: "Artículo largo con introducción, 2-3 secciones con subtítulos, y conclusión con llamado a la acción.",
};

const SYSTEM_PROMPT = `Sos Hermes, Lead de Marketing de RaccoonDev. Redactás copy en español para
distintos canales, siguiendo el brief que te dan. Mantené un tono profesional pero cercano,
característico de una consultora tech moderna. No inventes datos, cifras o resultados que no
te dieron.`;

/**
 * Genera copy para redes sociales/blog vía Claude API, a partir de un brief.
 * @param {{ channel: string, topic: string, tone?: string, callToAction?: string }} spec
 * @returns {Promise<object>} el post generado
 */
export async function draftPost(spec) {
  if (!spec || !spec.channel || !spec.topic) {
    throw new Error("draft_post: 'spec.channel' y 'spec.topic' son obligatorios");
  }

  const guideline = CHANNEL_GUIDELINES[spec.channel];
  if (!guideline) {
    throw new Error(`draft_post: canal '${spec.channel}' no reconocido — usar: ${Object.keys(CHANNEL_GUIDELINES).join(", ")}`);
  }

  const client = getAnthropicClient();
  const userMessage = `Canal: ${spec.channel}
Guía del canal: ${guideline}
Tema: ${spec.topic}
Tono deseado: ${spec.tone ?? "profesional y cercano"}
Llamado a la acción: ${spec.callToAction ?? "ninguno específico"}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock) {
    throw new Error("draft_post: Claude no devolvió texto");
  }

  const record = {
    id: randomUUID(),
    channel: spec.channel,
    topic: spec.topic,
    content: textBlock.text,
    createdAt: new Date().toISOString(),
  };

  await mkdir(POSTS_DIR, { recursive: true });
  await writeFile(path.join(POSTS_DIR, `${record.id}.json`), JSON.stringify(record, null, 2), "utf-8");

  return record;
}
