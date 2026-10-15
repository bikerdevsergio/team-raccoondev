import { sendMail } from "../lib/mailer.js";

/**
 * Envía un recordatorio de pago al cliente de una factura/proyecto.
 * El cliente no debe saber que esto lo generó un agente — firma como
 * "Equipo RaccoonDev", nunca como "Midas".
 * @param {{ clientEmail: string, clientName: string, amount: number, dueDate: string, invoiceId?: string }} invoice
 * @returns {Promise<{ success: boolean, skipped?: boolean }>}
 */
export async function paymentReminder(invoice) {
  if (!invoice || !invoice.clientEmail || typeof invoice.amount !== "number") {
    throw new Error("payment_reminder: 'invoice.clientEmail' y 'invoice.amount' son obligatorios");
  }

  const currency = process.env.BASE_CURRENCY ?? "USD";
  const subject = `Recordatorio de pago${invoice.invoiceId ? ` — Factura ${invoice.invoiceId}` : ""}`;
  const text = `Hola ${invoice.clientName ?? ""},

Te escribimos para recordarte el pago pendiente de ${invoice.amount} ${currency}, con vencimiento el ${invoice.dueDate}.

Cualquier consulta, respondé este email.

— Equipo RaccoonDev`;

  return sendMail({ to: invoice.clientEmail, subject, text });
}
