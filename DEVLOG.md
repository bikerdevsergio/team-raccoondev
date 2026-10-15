# DEVLOG — Team RaccoonDev

Registro central de decisiones, cambios y bugs del sistema multi-agente. Orden cronológico, más reciente abajo.

---

## 2026-10-15 — Inicio del proyecto
- Se definió el stack: Claude Code + GraphRAG (memoria en nodos) + Mods (JS/TS para UI/comportamiento).
- Se definió el orden de construcción de agentes: gg-raccoon (orquestador) → finance-lead → fullstack-dev → legal-lead → marketing-lead.
- Regla fundamental: ningún agente obtiene una función sin aprobación explícita del CEO (Sergi).

## 2026-10-15 — Renombramiento de carpeta y agente
- **Cambio:** carpeta `vice-code` renombrada a `gg-raccoon`.
- **Razón:** el CEO definió la identidad final del agente orquestador: codename **Dante**, rol "Gerente General de RaccoonDev".
- **Acción:** `git mv vice-code gg-raccoon`. Repositorio git inicializado en la raíz del proyecto (rama `main`).
- **Reporta a:** Sergi (CEO). **Coordina con:** VP (Claude, asesor estratégico externo).

## 2026-10-15 — Funciones aprobadas para Dante
El CEO aprobó 10 funciones para Dante (ver `gg-raccoon/AGENT.md` para el detalle de cada una):
`route_task`, `check_agent_status`, `devlog_writer`, `approval_queue`, `escalate_to_ceo`, `conflict_resolver`, `meeting_notes`, `weekly_team_review`, `graphrag_sync`, `status_panel_mod`.

## 2026-10-15 — Funciones rechazadas para Dante
- `memory_prune()` — **razón:** diferida, todavía no hay memoria suficiente para justificar compresión. Ver `gg-raccoon/REJECTED.md`.

## 2026-10-15 — Ampliación de escalate_to_ceo: email y notificaciones
- El CEO solicitó que `escalate_to_ceo` tenga capacidad de enviar email y notificar a la futura PWA.
- Cada agente tendrá su propio Gmail (redirigido vía Cloudflare); se usa **SMTP** (nodemailer) con credenciales en `gg-raccoon/.env` (gitignored, ver `.env.example`).
- Se agregó cola `shared/notifications.json` como placeholder: nadie la consume todavía, la PWA la leerá cuando se construya.
- Se fijó `nodemailer` en `^10.1.1` (la versión instalada por defecto, 9.1.1, caía en el rango vulnerable `<=10.0.8` de GHSA-6vj9-mwq6-2f5v y otros). `npm audit` queda en 0 vulnerabilidades.
- **Nota técnica:** nodemailer 10.x declara `engines.node >= 20`, pero el sistema corre Node 18.20.8. Funciona igual (solo warning `EBADENGINE`), pero conviene planear upgrade de Node a 20+.

## 2026-10-15 — Decisión de arquitectura: PWA
- Se reemplaza el plan original de APK + web app por una **única PWA** (funciona en móvil, desktop y tablet).
- Estética: cyberpunk / dark. Cada agente es un personaje raccoon con una oficina y una moto personalizable afuera.
- Layout: Recepción (Dante) → Oficina de Finanzas → Sala de Dev (Code, CTO) → Oficina Legal → Sala de Marketing → Sala de reuniones (integración Google Meet, se construye al final).
- La construcción de la PWA comienza **después** de que los 5 agentes estén aprobados y codeados.

## 2026-10-15 — meeting_notes se parte en dos modos
- El CEO definió que `meeting_notes` se implementa en dos modos: **Modo 1** (post-reunión, con Claude API) se codea ahora; **Modo 2** (en vivo, por WebSocket/streaming) queda como arquitectura documentada, sin codear, hasta que se construya la Sala de Reuniones (último módulo de la PWA).
- Modo 1 reemplaza el heurístico por palabras clave anterior: ahora usa `@anthropic-ai/sdk` + `claude-opus-5` con salida estructurada (Zod) para extraer requisitos, riesgos, implícitos y preguntas de seguimiento.
- Se agregó `ANTHROPIC_API_KEY` a `gg-raccoon/.env.example`. A diferencia del email (que se omite si falta credencial), `meeting_notes` falla explícitamente sin la key — no hay "modo degradado" razonable para una función cuyo propósito central es la IA.

## 2026-10-15 — meeting_notes: cambio de modelo a Sonnet 4.6
- El CEO pidió explícitamente usar `claude-sonnet-4-6` en vez de `claude-opus-5` para `meeting_notes` (Modo 1).
- **Razón:** decisión directa del CEO (costo/preferencia), no hay otra justificación técnica registrada.

## 2026-10-15 — graphrag_sync: decisión de arquitectura Neo4j AuraDB
- El CEO eligió **Neo4j AuraDB** (free tier cloud) como backend de la memoria GraphRAG de Dante, en vez de un grafo JSON liviano o Microsoft GraphRAG (Python).
- Esquema: nodos `Agent`/`Decision`/`Task`, relaciones `MADE_BY`/`ASSIGNED_TO`/`RELATED_TO`.
- Credenciales (`NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`) agregadas a `gg-raccoon/.env.example`. `npm install neo4j-driver` — 0 vulnerabilidades.

## 2026-10-15 — status_panel_mod completo: Dante (gg-raccoon) queda terminado
- Se codeó la función 10/10: `status_panel_mod`. Genera un dashboard HTML (`gg-raccoon/mods/status_panel.html`) con estética cyberpunk/dark, agregando el estado real del equipo, aprobaciones pendientes, escalaciones y conflictos congelados.
- Con esto, **las 10 funciones aprobadas para Dante están codeadas**. Dante (gg-raccoon) queda completo como primer agente del sistema.
- Publicado como artifact para revisión visual: https://claude.ai/artifact/JiUk6Rn6a8uAezhqNcq9ch
- **Próximo paso:** construir el agente 2 (finance-lead) siguiendo el mismo proceso — proponer nombre y funciones, esperar aprobación del CEO antes de codear.

## 2026-10-15 — status_panel_mod: corrección de enfoque (JSON, no HTML)
- El CEO corrigió el enfoque de `status_panel_mod`: no debe generar un HTML separado (`status_panel.html` fue eliminado). En su lugar, escribe todos los datos del panel (estado del equipo, aprobaciones pendientes, escalaciones, conflictos congelados) directamente en `shared/status/gg-raccoon.json`.
- **Razón:** la futura PWA es la que va a leer ese JSON y renderizarlo visualmente — generar HTML por separado duplicaba responsabilidad que le corresponde a la PWA.
- Función renombrada de `renderStatusPanel()` a `updateStatusPanel()` para reflejar que ya no "renderiza", solo actualiza estado.
