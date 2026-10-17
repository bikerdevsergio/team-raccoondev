import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Document, Packer, Paragraph, HeadingLevel } from "docx";
import { getAnthropicClient } from "../lib/anthropicClient.js";
import { convertDocxToPdf } from "../lib/docToPdf.js";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const DOCUMENTS_DIR = path.join(PROJECT_ROOT, "shared", "legal", "documents");

const SYSTEM_PROMPT = `Sos Themis, Lead Legal de RaccoonDev. Redactá una Política de Privacidad
y Términos de Servicio en español, clara y profesional, basada en los datos del proyecto que
recibís. Cubrí: qué datos se recolectan, finalidad, con quién se comparten, derechos del usuario
(acceso/rectificación/supresión conforme a Ley 1581 de 2012 de Colombia y, si aplica, GDPR),
período de retención, y contacto. SIEMPRE incluí al final: "Este es un borrador generado
automáticamente. Requiere revisión de un abogado antes de publicarse." No inventes datos que no
te dieron.`;

/**
 * Genera una Política de Privacidad / Términos de Servicio vía Claude API,
 * la exporta a .docx (editable) y a .pdf (vía LibreOffice). Es un borrador
 * — siempre requiere revisión humana antes de publicarse.
 * @param {{ name: string, dataCollected: string[], purpose: string, thirdPartySharing?: boolean, retentionPeriod?: string, contactEmail: string }} project
 * @returns {Promise<object>} { id, docxPath, pdfPath }
 */
export async function generatePrivacyPolicy(project) {
  if (!project || !project.name || !Array.isArray(project.dataCollected) || !project.purpose || !project.contactEmail) {
    throw new Error(
      "generate_privacy_policy: 'project.name', 'project.dataCollected', 'project.purpose' y 'project.contactEmail' son obligatorios"
    );
  }

  const client = getAnthropicClient();
  const userMessage = `Proyecto: ${project.name}
Datos recolectados: ${project.dataCollected.join(", ")}
Finalidad: ${project.purpose}
¿Se comparte con terceros?: ${project.thirdPartySharing ? "sí" : "no"}
Período de retención: ${project.retentionPeriod ?? "no especificado"}
Contacto: ${project.contactEmail}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock) {
    throw new Error("generate_privacy_policy: Claude no devolvió texto");
  }

  const id = randomUUID();
  const paragraphs = textBlock.text.split("\n").filter((line) => line.trim()).map((line) =>
    new Paragraph({ text: line })
  );

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ text: `Política de Privacidad — ${project.name}`, heading: HeadingLevel.HEADING_1 }),
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
    project: project.name,
    docxPath,
    pdfPath: pdfResult.success ? pdfResult.pdfPath : null,
    pdfError: pdfResult.success ? null : pdfResult.error,
    createdAt: new Date().toISOString(),
  };
}
