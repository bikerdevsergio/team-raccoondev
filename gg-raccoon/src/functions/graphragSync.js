import { randomUUID } from "node:crypto";
import neo4j from "neo4j-driver";
import { getNeo4jDriver } from "../lib/neo4jClient.js";

/**
 * Escribe un nodo de Decisión en la memoria GraphRAG de Dante, relacionado
 * con el agente que la tomó y (opcionalmente) con una tarea existente.
 * Guarda solo la decisión y su contexto — no el historial de conversación.
 * @param {{ agent: string, summary: string, type?: string, relatedTaskId?: string }} decision
 * @returns {Promise<{ id: string }>}
 */
export async function syncDecision(decision) {
  if (!decision || !decision.agent || !decision.summary) {
    throw new Error("graphrag_sync: 'decision.agent' y 'decision.summary' son obligatorios");
  }

  const driver = getNeo4jDriver();
  const session = driver.session();
  const id = randomUUID();

  try {
    await session.run(
      `MERGE (a:Agent {name: $agent})
       CREATE (d:Decision {id: $id, summary: $summary, type: $type, createdAt: datetime()})
       CREATE (d)-[:MADE_BY]->(a)
       WITH d
       OPTIONAL MATCH (t:Task {id: $relatedTaskId})
       FOREACH (_ IN CASE WHEN t IS NOT NULL THEN [1] ELSE [] END |
         CREATE (d)-[:RELATED_TO]->(t)
       )`,
      {
        agent: decision.agent,
        id,
        summary: decision.summary,
        type: decision.type ?? "general",
        relatedTaskId: decision.relatedTaskId ?? null,
      }
    );
  } finally {
    await session.close();
  }

  return { id };
}

/**
 * Escribe/actualiza un nodo de Tarea en la memoria GraphRAG, relacionado con
 * el agente asignado.
 * @param {{ id: string, agent: string, description: string, status: string }} task
 * @returns {Promise<{ id: string }>}
 */
export async function syncTask(task) {
  if (!task || !task.id || !task.agent) {
    throw new Error("graphrag_sync: 'task.id' y 'task.agent' son obligatorios");
  }

  const driver = getNeo4jDriver();
  const session = driver.session();

  try {
    await session.run(
      `MERGE (a:Agent {name: $agent})
       MERGE (t:Task {id: $id})
       SET t.description = $description, t.status = $status, t.updatedAt = datetime()
       MERGE (t)-[:ASSIGNED_TO]->(a)`,
      {
        id: task.id,
        agent: task.agent,
        description: task.description ?? "",
        status: task.status ?? "pending",
      }
    );
  } finally {
    await session.close();
  }

  return { id: task.id };
}

/**
 * Lee las decisiones y tareas más recientes de un agente desde la memoria
 * GraphRAG (para dar contexto, no el log completo de conversación).
 * @param {string} agent
 * @param {number} [limit]
 * @returns {Promise<{ decisions: object[], tasks: object[] }>}
 */
export async function queryAgentMemory(agent, limit = 20) {
  const driver = getNeo4jDriver();
  const session = driver.session();

  try {
    const decisionsResult = await session.run(
      `MATCH (d:Decision)-[:MADE_BY]->(a:Agent {name: $agent})
       RETURN d ORDER BY d.createdAt DESC LIMIT $limit`,
      { agent, limit: neo4j.int(limit) }
    );
    const tasksResult = await session.run(
      `MATCH (t:Task)-[:ASSIGNED_TO]->(a:Agent {name: $agent})
       RETURN t ORDER BY t.updatedAt DESC LIMIT $limit`,
      { agent, limit: neo4j.int(limit) }
    );

    return {
      decisions: decisionsResult.records.map((r) => r.get("d").properties),
      tasks: tasksResult.records.map((r) => r.get("t").properties),
    };
  } finally {
    await session.close();
  }
}
