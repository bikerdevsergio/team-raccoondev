import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Document, Packer, Paragraph, HeadingLevel } from "docx";
import { getAnthropicClient } from "../lib/anthropicClient.js";
import { convertDocxToPdf } from "../lib/docToPdf.js";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const PROPOSALS_DIR = path.join(PROJECT_ROOT, "shared", "marketing", "proposals");
const COST_ESTIMATES_DIR = path.join(PROJECT_ROOT, "shared", "finance", "cost_estimates");

const SYSTEM_PROMPT = `Sos Hermes, Lead de Marketing de RaccoonDev. Redactás una propuesta
comercial en español, profesional y persuasiva pero honesta, basada en los datos que recibís.
Estructura: resumen ejecutivo, alcance, cronograma estimado, inversión (si te dieron números
reales, usalos exactamente — NUNCA inventes cifras), y próximos pasos. No prometas nada que no
esté en los datos que te dieron.`;

/**
 * Genera una propuesta comercial vía Claude API, exporta a .docx + .pdf.
 * Si se pasa costEstimateId, lee el estimado real generado por
 * project_cost_estimate() de Midas (shared/finance/cost_estimates/) en vez
 * de inventar números.
 * @param {{ clientName: string, projectName: string, scope: string, timeline?: string, costEstimateId?: string }} spec
 * @returns {Promise<object>} { id, docxPath, pdfPath }
 */
export async function generateProposal(spec) {
  if (!spec || !spec.clientName || !spec.projectName || !spec.scope) {
    throw new Error("generate_proposal: 'spec.clientName', 'spec.projectName' y 'spec.scope' son obligatorios");
  }

  let costEstimate = null;
  if (spec.costEstimateId) {
    try {
      costEstimate = JSON.parse(
        await readFile(path.join(COST_ESTIMATES_DIR, `${spec.costEstimateId}.json`), "utf-8")
      );
    } catch (err) {
      throw new Error(`generate_proposal: no se encontró el estimado de costos '${spec.costEstimateId}' (${err.code ?? err.message})`);
    }
  }

  const client = getAnthropicClient();
  const userMessage = `Cliente: ${spec.clientName}
Proyecto: ${spec.projectName}
Alcance: ${spec.scope}
Cronograma estimado: ${spec.timeline ?? "a definir"}
${costEstimate
    ? `Inversión (estimado real de Midas, usar estos números exactos): ${JSON.stringify(costEstimate)}`
    : "Inversión: todavía no hay estimado de costos real — NO inventar cifras, indicar que se definirá en una siguiente etapa."}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock) {
    throw new Error("generate_proposal: Claude no devolvió texto");
  }

  const id = randomUUID();
  const paragraphs = textBlock.text.split("\n").filter((line) => line.trim()).map((line) =>
    new Paragraph({ text: line })
  );

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ text: `Propuesta — ${spec.projectName} para ${spec.clientName}`, heading: HeadingLevel.HEADING_1 }),
        ...paragraphs,
      ],
    }],
  });

  await mkdir(PROPOSALS_DIR, { recursive: true });
  const docxPath = path.join(PROPOSALS_DIR, `${id}.docx`);
  await writeFile(docxPath, await Packer.toBuffer(doc));

  const pdfResult = await convertDocxToPdf(docxPath, PROPOSALS_DIR);

  return {
    id,
    clientName: spec.clientName,
    projectName: spec.projectName,
    usedRealCostEstimate: Boolean(costEstimate),
    docxPath,
    pdfPath: pdfResult.success ? pdfResult.pdfPath : null,
    pdfError: pdfResult.success ? null : pdfResult.error,
    createdAt: new Date().toISOString(),
  };
}
