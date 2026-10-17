import { config as loadEnv } from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MARKETING_LEAD_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../");
loadEnv({ path: path.join(MARKETING_LEAD_ROOT, ".env") });

let client = null;

export function getAnthropicClient() {
  if (client) return client;
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY no configurada en marketing-lead/.env — completá ese valor antes de usar esta función."
    );
  }
  client = new Anthropic();
  return client;
}
