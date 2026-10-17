# Team RaccoonDev

Sistema multi-agente autónomo para una consultora low-code. Cada agente es un miembro del equipo con funciones propias, aprobadas una por una por el CEO antes de ser codeadas — nada se construye sin autorización explícita.

## Qué es esto

RaccoonDev funciona como una empresa de software operada por agentes: un Gerente General que orquesta, y leads especializados en finanzas, desarrollo, legal y marketing. El objetivo es que el equipo pueda operar 24/7 sin depender de la disponibilidad del CEO, con trazabilidad completa de cada decisión.

**Los 5 agentes del sistema están completos** (62 funciones aprobadas y codeadas en total). Sigue la construcción de la PWA.

## Agentes

| Agente | Carpeta | Rol | Estado |
|---|---|---|---|
| **Dante** | [`gg-raccoon/`](gg-raccoon/) | Gerente General — orquestador + secretario | ✅ completo (10/10 funciones) |
| **Midas** | [`finance-lead/`](finance-lead/) | Lead de Finanzas | ✅ completo (18/18 funciones) |
| **Volt** | [`fullstack-dev/`](fullstack-dev/) | CTO — Lead de Desarrollo | ✅ completo (12/12 funciones) |
| **Themis** | [`legal-lead/`](legal-lead/) | Lead Legal | ✅ completo (11/11 funciones) |
| **Hermes** | [`marketing-lead/`](marketing-lead/) | Lead de Marketing | ✅ completo (11/11 funciones) |

## Cómo funciona

- **Propuesta → aprobación → código.** Para cada agente se proponen nombre y funciones candidatas; el CEO aprueba o rechaza cada una antes de que se escriba una sola línea. Lo aprobado queda en `<agente>/AGENT.md`, lo rechazado (con la razón) en `<agente>/REJECTED.md`.
- **Memoria en nodos (GraphRAG).** Cada agente tiene su propio nodo de memoria — decisiones y tareas, no el historial completo de conversación. Los 5 agentes usan la misma instancia de Neo4j AuraDB, con nodos separados por agente.
- **Comunicación por archivos JSON compartidos.** Los agentes se coordinan vía `shared/` (inbox de tareas, cola de aprobaciones, escalaciones, conflictos, estado por agente) — sin llamadas API directas entre ellos todavía.
- **Todo queda documentado.** Cada decisión, cambio o bug se registra en [`DEVLOG.md`](DEVLOG.md), en orden cronológico.

## Stack

- **Claude Code** — agentes basados en Claude (API de Anthropic)
- **GraphRAG / Neo4j** — memoria de contexto en nodos
- **Mods (JS/TS)** — plugins de UI y comportamiento por agente
- **PWA** (futura) — interfaz visual única para todos los dispositivos, estética cyberpunk: cada agente es un raccoon con su oficina y moto propia; la Sala de Reuniones (con integración Google Meet) es el último módulo a construir.

## Reglas que no cambian

- Ninguna función se codea sin aprobación explícita del CEO.
- Nunca se construyen dos agentes al mismo tiempo.
- Cada decisión se loguea en `DEVLOG.md`.
- Se commitea a GitHub después de completar cada agente.
