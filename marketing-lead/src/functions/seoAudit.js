import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "../lib/filePolyfill.js";
import * as cheerio from "cheerio";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient } from "../lib/anthropicClient.js";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const AUDITS_DIR = path.join(PROJECT_ROOT, "shared", "marketing", "seo_audits");

const AuditSchema = z.object({
  opportunities: z.array(z.object({
    issue: z.string(),
    recommendation: z.string(),
    priority: z.enum(["low", "medium", "high"]),
  })),
  summary: z.string(),
});

const SYSTEM_PROMPT = `Sos Hermes, Lead de Marketing de RaccoonDev, haciendo un audit SEO básico
de una página. Te paso el título, meta description, y la estructura de headings (h1-h6) extraídos
del HTML real. Evaluá: ¿hay un solo H1?, ¿el título y meta description tienen longitud adecuada
(título ~50-60 caracteres, description ~150-160)?, ¿la jerarquía de headings es lógica?, ¿faltan
elementos clave? No inventes datos que no te dieron — trabajá solo con lo extraído.`;

/**
 * Hace fetch a una URL, extrae meta tags y estructura de headings, y
 * analiza oportunidades de mejora SEO vía Claude API.
 * @param {string} url
 * @returns {Promise<object>} el audit generado
 */
export async function seoAudit(url) {
  if (!url || !url.trim()) {
    throw new Error("seo_audit: 'url' es obligatorio");
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`seo_audit: no se pudo obtener la URL (HTTP ${response.status})`);
  }
  const html = await response.text();
  const $ = cheerio.load(html);

  const extracted = {
    title: $("title").first().text().trim() || null,
    metaDescription: $('meta[name="description"]').attr("content") ?? null,
    ogTitle: $('meta[property="og:title"]').attr("content") ?? null,
    ogDescription: $('meta[property="og:description"]').attr("content") ?? null,
    canonical: $('link[rel="canonical"]').attr("href") ?? null,
    headings: ["h1", "h2", "h3", "h4", "h5", "h6"].flatMap((tag) =>
      $(tag).map((_, el) => ({ level: tag, text: $(el).text().trim() })).get()
    ),
  };

  const client = getAnthropicClient();
  const userMessage = `URL: ${url}\n\nDatos extraídos:\n${JSON.stringify(extracted, null, 2)}`;

  const result = await client.messages.parse({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
    output_config: { format: zodOutputFormat(AuditSchema) },
  });

  if (!result.parsed_output) {
    throw new Error("seo_audit: Claude no devolvió una salida estructurada válida");
  }

  const audit = {
    id: randomUUID(),
    url,
    extracted,
    ...result.parsed_output,
    auditedAt: new Date().toISOString(),
  };

  await mkdir(AUDITS_DIR, { recursive: true });
  await writeFile(path.join(AUDITS_DIR, `${audit.id}.json`), JSON.stringify(audit, null, 2), "utf-8");

  return audit;
}
