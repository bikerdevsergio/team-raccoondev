import { config as loadEnv } from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
import path from "node:path";
import { fileURLToPath } from "node:url";

const GG_RACCOON_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../");
loadEnv({ path: path.join(GG_RACCOON_ROOT, ".env") });

let client = null;

/**
 * Cliente Anthropic compartido por Dante. Lee ANTHROPIC_API_KEY de gg-raccoon/.env.
 * Lanza un error claro (no silencioso) si falta la key, porque a diferencia del
 * email, una función que depende del LLM no tiene forma de "seguir sin esto".
 */
export function getAnthropicClient() {
  if (client) return client;
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY no configurada en gg-raccoon/.env — completá ese valor antes de usar meeting_notes."
    );
  }
  client = new Anthropic();
  return client;
}
