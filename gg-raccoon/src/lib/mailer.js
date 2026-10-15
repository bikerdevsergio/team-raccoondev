import { config as loadEnv } from "dotenv";
import nodemailer from "nodemailer";
import path from "node:path";
import { fileURLToPath } from "node:url";

const GG_RACCOON_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../");
loadEnv({ path: path.join(GG_RACCOON_ROOT, ".env") });

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 465,
    secure: Number(SMTP_PORT) !== 587,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

/**
 * Envía un email. Si el SMTP no está configurado (.env ausente), no falla:
 * devuelve { success: false, skipped: true } y deja que el flujo que llama
 * siga adelante (la escalación igual queda registrada en JSON + DEVLOG).
 * @param {{ to: string, subject: string, text: string }} mail
 * @returns {Promise<{ success: boolean, skipped?: boolean, error?: string }>}
 */
export async function sendMail({ to, subject, text }) {
  const t = getTransporter();
  if (!t) {
    console.warn("[mailer] SMTP no configurado (falta gg-raccoon/.env) — email omitido.");
    return { success: false, skipped: true };
  }

  try {
    await t.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      text,
    });
    return { success: true };
  } catch (err) {
    console.error("[mailer] error enviando email:", err.message);
    return { success: false, error: err.message };
  }
}
