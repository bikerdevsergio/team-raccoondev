import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Document, Packer, Paragraph, HeadingLevel } from "docx";
import { getAnthropicClient } from "../lib/anthropicClient.js";
import { convertDocxToPdf } from "../lib/docToPdf.js";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const DOCUMENTS_DIR = path.join(PROJECT_ROOT, "shared", "legal", "documents");

const SYSTEM_PROMPT = `Sos Themis, Lead Legal de RaccoonDev. Redactá un borrador de contrato/NDA
en español, claro y profesional, basado en los datos que recibís. Estructuralo en cláusulas
numeradas. SIEMPRE incluí al final una nota: "Este es un borrador generado automáticamente.
Requiere revisión de un abogado antes de tener validez legal." No inventes datos que no te dieron.`;

/**
 * Genera un borrador de contrato/NDA vía Claude API, lo exporta a .docx
 * (editable) y a .pdf (vía LibreOffice). Es un borrador — siempre requiere
 * revisión humana antes de tener validez legal.
 * @param {{ clientName: string, contractType: string, scope: string, terms?: string, startDate?: string, endDate?: string }} spec
 * @returns {Promise<object>} { id, docxPath, pdfPath }
 */
export async function draftContract(spec) {
  if (!spec || !spec.clientName || !spec.contractType || !spec.scope) {
    throw new Error("draft_contract: 'spec.clientName', 'spec.contractType' y 'spec.scope' son obligatorios");
  }

  const client = getAnthropicClient();
  const userMessage = `Tipo de contrato: ${spec.contractType}
Cliente: ${spec.clientName}
Alcance: ${spec.scope}
Términos adicionales: ${spec.terms ?? "ninguno especificado"}
Fecha de inicio: ${spec.startDate ?? "a definir"}
Fecha de fin: ${spec.endDate ?? "a definir"}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock) {
    throw new Error("draft_contract: Claude no devolvió texto");
  }

  const id = randomUUID();
  const paragraphs = textBlock.text.split("\n").filter((line) => line.trim()).map((line) =>
    new Paragraph({ text: line })
  );

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ text: `${spec.contractType} — ${spec.clientName}`, heading: HeadingLevel.HEADING_1 }),
        ...paragraphs,
      ],
    }],
  });

  await mkdir(DOCUMENTS_DIR, { recursive: true });
  const docxPath = path.join(DOCUMENTS_DIR, `${id}.docx`);
  await writeFile(docxPath, await Packer.toBuffer(doc));

  const pdfResult = await convertDocxToPdf(docxPath, DOCUMENTS_DIR);

  return {
    id,
    clientName: spec.clientName,
    contractType: spec.contractType,
    docxPath,
    pdfPath: pdfResult.success ? pdfResult.pdfPath : null,
    pdfError: pdfResult.success ? null : pdfResult.error,
    createdAt: new Date().toISOString(),
  };
}
