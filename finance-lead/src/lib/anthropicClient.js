import { config as loadEnv } from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FINANCE_LEAD_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../");
loadEnv({ path: path.join(FINANCE_LEAD_ROOT, ".env") });

let client = null;

export function getAnthropicClient() {
  if (client) return client;
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY no configurada en finance-lead/.env — completá ese valor antes de usar meeting_presence."
    );
  }
  client = new Anthropic();
  return client;
}
