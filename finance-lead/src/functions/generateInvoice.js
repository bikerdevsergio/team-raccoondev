import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const INVOICES_DIR = path.join(PROJECT_ROOT, "shared", "finance", "invoices");

function buildInvoiceText(invoice) {
  const lines = [
    `FACTURA ${invoice.invoiceId}`,
    `Fecha de emisión: ${invoice.issueDate}`,
    `Vencimiento: ${invoice.dueDate}`,
    "",
    `Cliente: ${invoice.clientName} <${invoice.clientEmail}>`,
    "",
    "Ítems:",
    ...invoice.items.map((item) => `  - ${item.description}: ${item.amount} ${invoice.currency}`),
    "",
    `TOTAL: ${invoice.totalAmount} ${invoice.currency}`,
    "",
    "— Equipo RaccoonDev",
  ];
  return lines.join("\n");
}

function buildInvoicePdf(invoice, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = createWriteStream(outputPath);
    doc.pipe(stream);

    doc.fontSize(20).text(`Factura ${invoice.invoiceId}`);
    doc.moveDown(0.5);
    doc.fontSize(10)
      .text(`Fecha de emisión: ${invoice.issueDate}`)
      .text(`Vencimiento: ${invoice.dueDate ?? "-"}`);
    doc.moveDown();
    doc.text(`Cliente: ${invoice.clientName} <${invoice.clientEmail}>`);
    doc.moveDown();

    doc.fontSize(12).text("Ítems", { underline: true });
    doc.fontSize(10).moveDown(0.3);
    for (const item of invoice.items) {
      doc.text(`${item.description} — ${item.amount} ${invoice.currency}`);
    }

    doc.moveDown();
    doc.fontSize(14).text(`TOTAL: ${invoice.totalAmount} ${invoice.currency}`, { align: "right" });
    doc.moveDown(2);
    doc.fontSize(10).text("Equipo RaccoonDev", { align: "center" });

    doc.end();
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}

/**
 * Genera una factura (texto + PDF) a partir de ítems y datos del cliente.
 * El PDF es el documento que se envía al cliente; el .txt/.json quedan
 * como registro interno legible/estructurado.
 * @param {{ clientId: string, clientName: string, clientEmail: string, items: Array<{description: string, amount: number}>, invoiceId?: string, issueDate?: string, dueDate?: string }} data
 * @returns {Promise<object>} la factura generada, con rutas de .pdf/.txt/.json
 */
export async function generateInvoice(data) {
  if (!data || !data.clientName || !Array.isArray(data.items) || data.items.length === 0) {
    throw new Error("generate_invoice: 'data.clientName' y 'data.items' (no vacío) son obligatorios");
  }
  if (!data.clientId) {
    throw new Error("generate_invoice: 'data.clientId' es obligatorio");
  }

  const totalAmount = data.items.reduce((sum, item) => sum + item.amount, 0);
  const invoice = {
    id: randomUUID(),
    invoiceId: data.invoiceId ?? `INV-${Date.now()}`,
    clientId: data.clientId,
    clientName: data.clientName,
    clientEmail: data.clientEmail,
    items: data.items,
    totalAmount,
    currency: process.env.BASE_CURRENCY ?? "USD",
    issueDate: data.issueDate ?? new Date().toISOString().slice(0, 10),
    dueDate: data.dueDate ?? null,
    createdAt: new Date().toISOString(),
  };

  await mkdir(INVOICES_DIR, { recursive: true });
  const textPath = path.join(INVOICES_DIR, `${invoice.id}.txt`);
  const pdfPath = path.join(INVOICES_DIR, `${invoice.id}.pdf`);

  await writeFile(textPath, buildInvoiceText(invoice), "utf-8");
  await buildInvoicePdf(invoice, pdfPath);
  await writeFile(path.join(INVOICES_DIR, `${invoice.id}.json`), JSON.stringify(invoice, null, 2), "utf-8");

  return { ...invoice, textPath, pdfPath };
}
