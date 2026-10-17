import { randomUUID } from "node:crypto";
import neo4j from "neo4j-driver";
import { getNeo4jDriver } from "../lib/neo4jClient.js";

/**
 * Escribe un nodo de Decisión legal en la memoria GraphRAG de Themis.
 * @param {{ summary: string, type?: string, relatedTaskId?: string }} decision
 * @returns {Promise<{ id: string }>}
 */
export async function syncDecision(decision) {
  if (!decision || !decision.summary) {
    throw new Error("graphrag_sync: 'decision.summary' es obligatorio");
  }

  const driver = getNeo4jDriver();
  const session = driver.session();
  const id = randomUUID();

  try {
    await session.run(
      `MERGE (a:Agent {name: "themis"})
       CREATE (d:Decision {id: $id, summary: $summary, type: $type, createdAt: datetime()})
       CREATE (d)-[:MADE_BY]->(a)
       WITH d
       OPTIONAL MATCH (t:Task {id: $relatedTaskId})
       FOREACH (_ IN CASE WHEN t IS NOT NULL THEN [1] ELSE [] END |
         CREATE (d)-[:RELATED_TO]->(t)
       )`,
      { id, summary: decision.summary, type: decision.type ?? "legal", relatedTaskId: decision.relatedTaskId ?? null }
    );
  } finally {
    await session.close();
  }

  return { id };
}

/**
 * Lee las decisiones legales más recientes de Themis desde la memoria GraphRAG.
 * @param {number} [limit]
 * @returns {Promise<object[]>}
 */
export async function queryMemory(limit = 20) {
  const driver = getNeo4jDriver();
  const session = driver.session();

  try {
    const result = await session.run(
      `MATCH (d:Decision)-[:MADE_BY]->(a:Agent {name: "themis"})
       RETURN d ORDER BY d.createdAt DESC LIMIT $limit`,
      { limit: neo4j.int(limit) }
    );
    return result.records.map((r) => r.get("d").properties);
  } finally {
    await session.close();
  }
}
