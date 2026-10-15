# gg-raccoon — Dante

**Codename:** Dante
**Rol:** Gerente General de RaccoonDev (orquestador + secretario)
**Reporta a:** Sergi (CEO)
**Coordina con:** VP (Claude, asesor estratégico externo)
**Carpeta:** `gg-raccoon/` (renombrada desde `vice-code` el 2026-10-15, ver DEVLOG.md raíz)

## Funciones aprobadas

| # | Función | Descripción | Estado |
|---|---------|-------------|--------|
| 1 | `route_task(task)` | Asigna una tarea entrante al agente lead correcto (finance/fullstack/legal/marketing) | ✅ codeado |
| 2 | `check_agent_status()` | Lee el archivo JSON de estado compartido de cada agente | ✅ codeado |
| 3 | `devlog_writer(entry)` | Agrega entradas estructuradas al DEVLOG.md raíz | ✅ codeado |
| 4 | `approval_queue()` | Mantiene la lista de funciones/decisiones pendientes de aprobación del CEO | ✅ codeado |
| 5 | `escalate_to_ceo(decision)` | Marca una decisión como importante, la pausa hasta que Sergi la apruebe, envía email por SMTP y encola notificación para la futura PWA | ✅ codeado |
| 6 | `conflict_resolver(task)` | Congela conflictos entre agentes y los reporta al CEO (nunca auto-resuelve) | pendiente de código |
| 7 | `meeting_notes(input)` | **Modo 1** (post-reunión, codeado): procesa la transcripción completa con Claude API (`claude-sonnet-4-6`, salida estructurada) y extrae requisitos, riesgos, implícitos y preguntas de seguimiento. **Modo 2** (en vivo, solo arquitectura/placeholder, NO codeado): procesará chunks por WebSocket con streaming cuando exista la Sala de Reuniones. | ✅ Modo 1 codeado / Modo 2 placeholder |
| 8 | `weekly_team_review()` | Compila el estado semanal del equipo: tareas por estado (inbox), bloqueos (conflictos congelados + escalaciones pendientes) e highlights (DEVLOG de los últimos 7 días) por agente | ✅ codeado |
| 9 | `graphrag_sync()` | Lee/escribe el nodo de memoria GraphRAG de Dante en Neo4j AuraDB (decisiones y tareas como grafo, no logs completos) | ✅ codeado |
| 10 | `status_panel_mod` | Mod que genera un dashboard HTML (cyberpunk/dark) con el estado del equipo, aprobaciones pendientes, escalaciones y conflictos congelados de Dante | ✅ codeado |

Cada función se codea una por una, en el orden listado arriba, y se muestra el código al CEO antes de darla por finalizada.

**Las 10 funciones aprobadas están codeadas.** Dante queda completo como primer agente del sistema.

## Mod de estado (status_panel_mod)
`mods/statusPanel.js` → `renderStatusPanel()` agrega estado del equipo (`check_agent_status`), aprobaciones pendientes (`approval_queue`), escalaciones (`escalate_to_ceo`) y conflictos congelados (`conflict_resolver`) en un snapshot HTML (`mods/status_panel.html`), estética cyberpunk/dark — semilla visual de la futura recepción de la PWA. Se regenera llamando a la función de nuevo.

## Memoria (GraphRAG)
`graphrag_sync()` usa **Neo4j AuraDB** (free tier cloud) como grafo de memoria de Dante — decisión del CEO. Esquema: nodos `Agent`, `Decision`, `Task`; relaciones `MADE_BY`, `ASSIGNED_TO`, `RELATED_TO`. Guarda decisiones y tareas, no el historial completo de conversación. Credenciales en `gg-raccoon/.env` (`NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`), ver `.env.example`. Igual que con `ANTHROPIC_API_KEY`, falla explícitamente si faltan — no hay "modo degradado" razonable para la memoria.

## Comunicación
Dante lee/escribe archivos JSON compartidos en `shared/` en la raíz del proyecto. No hay llamadas API directas entre agentes todavía.

## Email y notificaciones (ampliación aprobada 2026-10-15)
- Cada agente tendrá su propio correo Gmail (redirigido vía Cloudflare, administrador del dominio). Dante envía por **SMTP** usando `gg-raccoon/.env` (ver `.env.example`, nunca se commitea).
- `escalate_to_ceo` envía email real al CEO (`CEO_EMAIL`) y además encola una notificación en `shared/notifications.json` para cuando exista la PWA. Si `.env` no está configurado, el envío de email se omite sin romper el flujo (se loguea un warning).

## Claude API (ampliación aprobada 2026-10-15, función meeting_notes)
- `meeting_notes` Modo 1 usa `@anthropic-ai/sdk` con el modelo `claude-sonnet-4-6` (elegido explícitamente por el CEO) y salida estructurada (Zod) para extraer requisitos/riesgos/implícitos/preguntas de una transcripción completa.
- Requiere `ANTHROPIC_API_KEY` en `gg-raccoon/.env` (ver `.env.example`). A diferencia del email, si falta la key la función falla explícitamente (no tiene sentido "seguir sin IA" en una función cuyo propósito ES la IA).
- Modo 2 (en vivo, WebSocket + streaming) queda solo como placeholder documentado en `src/functions/meetingNotesLive.js` — se codea recién cuando se construya la Sala de Reuniones.
