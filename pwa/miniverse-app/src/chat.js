import { config as loadEnv } from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../");
loadEnv({ path: path.join(APP_ROOT, ".env") });

const CHAT_DIR = path.join(APP_ROOT, "..", "..", "shared", "chat");

const PERSONAS = {
  dante: "Sos Dante, Gerente General de RaccoonDev — orquestás al equipo y sos el brazo derecho de Sergi (el CEO).",
  midas: "Sos Midas, Lead de Finanzas de RaccoonDev — presupuestos, facturación, rentabilidad.",
  volt: "Sos Volt, CTO de RaccoonDev — arquitectura, desarrollo, deploys, calidad de código.",
  themis: "Sos Themis, Lead Legal de RaccoonDev — contratos, compliance, riesgo legal.",
  hermes: "Sos Hermes, Lead de Marketing de RaccoonDev — contenido, campañas, marca, leads.",
};

const TEXT_EXTENSIONS = [".txt", ".md", ".js", ".ts", ".jsx", ".tsx", ".py", ".json", ".html", ".css", ".yml", ".yaml", ".sh"];

let client = null;
function getClient() {
  if (client) return client;
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY no configurada en pwa/miniverse-app/.env");
  }
  client = new Anthropic();
  return client;
}

function historyPath(officeId) {
  return path.join(CHAT_DIR, `${officeId}.json`);
}

async function readHistory(officeId) {
  try {
    return JSON.parse(await readFile(historyPath(officeId), "utf-8"));
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function writeHistory(officeId, turns) {
  await mkdir(CHAT_DIR, { recursive: true });
  await writeFile(historyPath(officeId), JSON.stringify(turns, null, 2), "utf-8");
}

function isTextFile(name, mimeType) {
  if (mimeType?.startsWith("text/")) return true;
  const lower = name.toLowerCase();
  return TEXT_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function buildContentBlocks(text, attachments, fileLabels) {
  const blocks = [];

  for (const att of attachments ?? []) {
    if (att.mimeType?.startsWith("image/")) {
      blocks.push({ type: "image", source: { type: "base64", media_type: att.mimeType, data: att.dataBase64 } });
      fileLabels.push(att.name);
    } else if (att.mimeType === "application/pdf") {
      blocks.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: att.dataBase64 } });
      fileLabels.push(att.name);
    } else if (isTextFile(att.name, att.mimeType)) {
      const content = Buffer.from(att.dataBase64, "base64").toString("utf-8");
      blocks.push({ type: "text", text: `Archivo adjunto "${att.name}":\n\n${content}` });
      fileLabels.push(att.name);
    } else {
      fileLabels.push(`${att.name} (tipo no soportado, ignorado)`);
    }
  }

  blocks.push({ type: "text", text: text?.trim() || "(el usuario no escribió texto, solo adjuntó archivos)" });
  return blocks;
}

/**
 * Envía un mensaje de chat a un agente (persona de Claude) y devuelve su
 * respuesta. Persiste el historial en shared/chat/<officeId>.json.
 */
export async function sendChatMessage(officeId, { text, attachments }) {
  const persona = PERSONAS[officeId];
  if (!persona) {
    throw new Error(`chat: oficina desconocida '${officeId}'`);
  }

  const history = await readHistory(officeId);
  const fileLabels = [];
  const userBlocks = buildContentBlocks(text, attachments, fileLabels);

  const anthropic = getClient();
  const systemPrompt = `${persona} Estás charlando directamente con Sergi (el CEO) por chat, lo llamaste a tu oficina o él te llamó a la suya. Respondé en español, con tono natural y la perspectiva de tu rol. Sos un asistente conversacional en este chat — no ejecutás funciones reales desde acá, pero podés asesorar, proponer y discutir.`;

  const apiMessages = [
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: userBlocks },
  ];

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    system: systemPrompt,
    messages: apiMessages,
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const reply = textBlock?.text ?? "(sin respuesta de texto)";

  const now = new Date().toISOString();
  history.push({ role: "user", content: userBlocks, displayText: text?.trim() ?? "", files: fileLabels, timestamp: now });
  history.push({ role: "assistant", content: [{ type: "text", text: reply }], displayText: reply, files: [], timestamp: now });
  await writeHistory(officeId, history);

  return { reply };
}

/** Historial simplificado para mostrar en el chat (texto + nombres de archivo). */
export async function getChatHistory(officeId) {
  const history = await readHistory(officeId);
  return history.map((h) => ({ role: h.role, text: h.displayText ?? "", files: (h.files ?? []).map((name) => ({ name })) }));
}
