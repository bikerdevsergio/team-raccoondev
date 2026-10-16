import { config as loadEnv } from "dotenv";
import neo4j from "neo4j-driver";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FULLSTACK_DEV_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../");
loadEnv({ path: path.join(FULLSTACK_DEV_ROOT, ".env") });

let driver = null;

export function getNeo4jDriver() {
  if (driver) return driver;
  const { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD } = process.env;
  if (!NEO4J_URI || !NEO4J_USER || !NEO4J_PASSWORD) {
    throw new Error(
      "NEO4J_URI/NEO4J_USER/NEO4J_PASSWORD no configurados en fullstack-dev/.env — completá esos valores antes de usar graphrag_sync."
    );
  }
  driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
  return driver;
}
