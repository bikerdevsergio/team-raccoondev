import { config as loadEnv } from "dotenv";
import neo4j from "neo4j-driver";
import path from "node:path";
import { fileURLToPath } from "node:url";

const GG_RACCOON_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../");
loadEnv({ path: path.join(GG_RACCOON_ROOT, ".env") });

let driver = null;

/**
 * Driver de Neo4j AuraDB compartido. Lee NEO4J_URI/NEO4J_USER/NEO4J_PASSWORD
 * de gg-raccoon/.env. Falla explícitamente si faltan — igual que con
 * ANTHROPIC_API_KEY, no tiene sentido un "modo degradado" para la memoria.
 */
export function getNeo4jDriver() {
  if (driver) return driver;
  const { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD } = process.env;
  if (!NEO4J_URI || !NEO4J_USER || !NEO4J_PASSWORD) {
    throw new Error(
      "NEO4J_URI/NEO4J_USER/NEO4J_PASSWORD no configurados en gg-raccoon/.env — completá esos valores antes de usar graphrag_sync."
    );
  }
  driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
  return driver;
}

export async function closeNeo4jDriver() {
  if (driver) {
    await driver.close();
    driver = null;
  }
}
