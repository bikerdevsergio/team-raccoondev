import { config as loadEnv } from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FULLSTACK_DEV_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../");
loadEnv({ path: path.join(FULLSTACK_DEV_ROOT, ".env") });

let client = null;

export function getAnthropicClient() {
  if (client) return client;
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY no configurada en fullstack-dev/.env — completá ese valor antes de usar code_review."
    );
  }
  client = new Anthropic();
  return client;
}
