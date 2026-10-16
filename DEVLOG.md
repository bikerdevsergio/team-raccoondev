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

## 2026-10-15 — Agente 2: Midas (finance-lead) iniciado
- El CEO definió identidad y 18 funciones aprobadas para Midas (finance-lead), Lead de Finanzas. Reporta a Sergi, coordina con Dante.
- Función 1/18 `track_expense(entry)` codeada y probada: registra gastos en `shared/finance/expenses.json`.

## 2026-10-15 — Midas: funciones 2-4 codeadas, moneda base y umbral definidos
- Funciones 2/18 (`track_income`), 3/18 (`budget_report`) y 4/18 (`flag_large_expense`) codeadas y probadas.
- `flag_large_expense` respeta la regla de "solo JSON compartido entre agentes": escribe directo en `shared/escalations.json` con el mismo formato que usa `escalate_to_ceo` de Dante, sin importar su código.
- El CEO definió: moneda base del sistema = **USD** (todos los montos se registran en USD), y agregó `BASE_CURRENCY` + `EXPENSE_THRESHOLD` a `finance-lead/.env.example`.

## 2026-10-15 — Midas: función 5/18 payment_reminder + firma de marca cara al cliente
- Función 5/18 `payment_reminder(invoice)` codeada: envía recordatorio de pago vía SMTP propio de Midas.
- **Regla de marca:** cualquier email a un cliente firma como "Equipo RaccoonDev", nunca con el nombre del agente (Midas es interno, el cliente no debe saber que es un agente). Aplica a toda comunicación externa, no solo a esta función.
- `npm install nodemailer dotenv` en `finance-lead/` — se repitió el mismo problema de versión vulnerable que en Dante, fijado a `nodemailer@^10.1.1` (0 vulnerabilidades).

## 2026-10-15 — Midas: función 6/18 generate_invoice con PDF real
- Función 6/18 `generate_invoice(data)` codeada: genera factura en PDF (vía `pdfkit`, el documento que se envía al cliente) además de `.txt`/`.json` como registro interno.
- `npm install pdfkit` en `finance-lead/` — 0 vulnerabilidades.

## 2026-10-15 — Midas: función 7/18 tax_summary codeada
- Función 7/18 `tax_summary(period)` codeada y probada: compila ingreso total, gasto deducible por categoría y base imponible estimada de un período, para pasarle al contador. Asume todos los gastos registrados como deducibles (nota aclaratoria en el output — requiere revisión del contador según normativa).

## 2026-10-15 — Midas: función 8/18 sync_status codeada
- Función 8/18 `sync_status()` codeada y probada: escribe `shared/status/finance-lead.json` (estado + escalaciones de gasto propias pendientes), mismo archivo que lee `check_agent_status()` de Dante.

## 2026-10-15 — Midas: función 9/18 graphrag_sync codeada
- Función 9/18 `graphrag_sync()` codeada: usa la misma instancia Neo4j AuraDB que Dante, nodo `Agent {name: "midas"}` separado. `npm install neo4j-driver` en `finance-lead/` — 0 vulnerabilidades. Probado que falla con mensaje claro sin credenciales.

## 2026-10-15 — Midas: función 10/18 project_cost_estimate + tarifas estándar
- Función 10/18 `project_cost_estimate(project)` codeada y probada: costo de mano de obra + costos fijos + precio sugerido según margen.
- Se agregó `shared/finance/config/rates.json` con tarifas estándar por rol (CEO, dev, diseño, consultoría) en USD/hora, editable sin tocar código. Si `laborHours` no trae `hourlyRate`, se busca ahí automáticamente.

## 2026-10-15 — Midas: función 11/18 rentability_check codeada
- Función 11/18 `rentability_check(project)` codeada y probada: calcula margen real vs mínimo aceptable; si no alcanza, cancela el proyecto por default y escala a CEO vía `shared/escalations.json` (requiere aprobación explícita para seguir).

## 2026-10-15 — Midas: función 12/18 service_inventory codeada
- Función 12/18 `service_inventory()` codeada y probada: lee `shared/finance/config/services.json` (seed inicial con Claude API, Neo4j AuraDB, VPS en 0 — costos reales a completar por el CEO), calcula total mensual y alertas por umbral.

## 2026-10-15 — Midas: clientId obligatorio, función 13/18 portfolio_manager
- El CEO pidió agregar `clientId` como campo obligatorio en `track_income`, `generate_invoice` y `portfolio_manager`, para que el matching de pagos a cliente sea por ID y no por nombre/texto (evita falsos matches). Se actualizaron `trackIncome.js` y `generateInvoice.js` para exigirlo.
- Función 13/18 `portfolio_manager()` codeada y probada: agrega facturación, pagos y deuda pendiente por `clientId`, guarda snapshot en `shared/finance/portfolio.json`.

## 2026-10-15 — Midas: función 14/18 suspend_service codeada
- Función 14/18 `suspend_service(client)` codeada y probada: consulta la deuda del cliente vía `portfolio_manager` y escala la propuesta de suspensión a CEO — nunca ejecuta nada por sí sola (no existe todavía un sistema real de accesos/servicios de cliente para suspender).

## 2026-10-15 — Midas: función 15/18 payroll codeada
- Función 15/18 `payroll()` codeada y probada: como no hay integración bancaria real, Midas no transfiere dinero — propone el pago en COP a Sergi, escala para confirmación manual, y guarda el plan de RaccoonCoins para distribuir una vez exista `raccoin_ledger` (función 16).

## 2026-10-15 — Midas: función 16/18 raccoin_ledger codeada
- Función 16/18 `raccoin_ledger(agent, amount)` codeada y probada: ledger de RaccoonCoins en `shared/finance/raccoin_ledger.json`, balances + historial de transacciones por agente. Sin valor monetario real, sin conversión a dinero, nunca permite balance negativo.

## 2026-10-15 — Midas: función 17/18 financial_growth codeada
- Función 17/18 `financial_growth()` codeada y probada: calcula colchón acumulado (ingresos - gastos de todo el historial) y lo compara contra el snapshot anterior guardado en `shared/finance/growth_history.json`.

## 2026-10-15 — Midas completo: 18/18 funciones codeadas, segundo agente del sistema
- Función 18/18 `meeting_presence(transcript_chunk)` codeada: usa Claude API (`claude-sonnet-4-6`, salida estructurada) para detectar implicaciones financieras en un fragmento de reunión, y si corresponde, escala vía `shared/escalations.json` — comunica a Dante sin llamada directa entre agentes.
- `npm install @anthropic-ai/sdk zod` en `finance-lead/` — 0 vulnerabilidades. Probado que falla con mensaje claro sin `ANTHROPIC_API_KEY`.
- **Con esto, las 18 funciones aprobadas para Midas (finance-lead) están codeadas.** Midas queda completo como segundo agente del sistema.
- **Próximo paso:** construir el agente 3 (fullstack-dev / Code) siguiendo el mismo proceso.

## 2026-10-16 — Agente 3: Volt (fullstack-dev) iniciado
- El CEO definió identidad y 12 funciones aprobadas para Volt (fullstack-dev), CTO. Reporta a Sergi, coordina con Dante y Midas.
- **Regla fundamental:** ciclo obligatorio REQUISITOS → DISEÑO → DESARROLLO → QA → PRODUCCIÓN (`src/lib/devCycle.js`). Ningún salto de fase sin aprobación explícita del CEO; un intento de salto se congela y escala vía `shared/escalations.json`.
- Función 1/12 `create_task(spec)` codeada y probada: crea tareas en `shared/inbox/fullstack-dev/` siempre en fase "requisitos"; detecta y congela intentos de salto de fase en la creación.

## 2026-10-16 — Volt: función 2/12 run_tests codeada
- Función 2/12 `run_tests(target)` codeada y probada (caso pass y fail): ejecuta un comando (default `npm test`) en el directorio del proyecto, captura stdout/stderr/exit code, guarda resultado en `shared/test_results/`.

## 2026-10-16 — Volt: función 3/12 code_review codeada
- Función 3/12 `code_review(diff)` codeada: usa Claude API (`claude-sonnet-4-6`, salida estructurada) para revisar un diff/PR buscando bugs, seguridad y simplificaciones. `npm install @anthropic-ai/sdk zod dotenv` en `fullstack-dev/` — 0 vulnerabilidades. Probado que falla con mensaje claro sin `ANTHROPIC_API_KEY`.

## 2026-10-16 — Volt: función 4/12 deploy codeada
- Función 4/12 `deploy(target, environment)` codeada y probada (staging ejecuta, producción congela y escala): comandos por proyecto/ambiente en `shared/dev/deploy_configs.json` (seed vacío, editable a mano). Producción NUNCA se ejecuta automáticamente.

## 2026-10-16 — Volt: función 5/12 bug_tracker codeada
- Función 5/12 `bug_tracker(entry)` codeada y probada: registra bugs en `shared/bugs/bugs.json` con severidad (low/medium/high/critical), proyecto y estado "open".

## 2026-10-16 — Volt: función 6/12 dependency_audit codeada
- Función 6/12 `dependency_audit()` codeada y probada contra los 3 agentes reales existentes: 0 vulnerabilidades en gg-raccoon, finance-lead y fullstack-dev; legal-lead/marketing-lead marcados "skipped" (todavía no construidos). Reporte real en `shared/dev/dependency_audit.json`.

## 2026-10-16 — Volt: función 7/12 scaffold_project codeada
- Función 7/12 `scaffold_project(spec)` codeada y probada: crea estructura base de proyecto (carpetas, package.json, README) en `shared/dev/projects/<name>/` y registra la tarea inicial en fase "requisitos" reutilizando `create_task`.

## 2026-10-16 — Volt: función 8/12 api_health_check codeada
- Función 8/12 `api_health_check()` codeada y probada (sin credenciales → los 3 servicios reportan "not_configured", sin escalar falsos positivos). Chequea Claude API, Neo4j AuraDB y SMTP; solo escala a CEO si un servicio configurado falla de verdad.
- Se agregaron libs `fullstack-dev/src/lib/mailer.js` y `neo4jClient.js` (mismo patrón que Dante/Midas), reutilizables por `graphrag_sync` (función 10) cuando se apruebe. `npm install nodemailer@^10.1.1 neo4j-driver` — 0 vulnerabilidades.

## 2026-10-16 — Volt: función 9/12 sync_status codeada
- Función 9/12 `sync_status()` codeada y probada: escribe `shared/status/fullstack-dev.json` (estado, escalaciones propias pendientes, bugs abiertos), mismo archivo que lee `check_agent_status()` de Dante.

## 2026-10-16 — Volt: función 10/12 graphrag_sync codeada
- Función 10/12 `graphrag_sync()` codeada: usa la misma instancia Neo4j AuraDB que Dante/Midas, nodo `Agent {name: "volt"}` separado. Probado que falla con mensaje claro sin credenciales.

## 2026-10-16 — Volt: función 11/12 tech_debt_report codeada
- Función 11/12 `tech_debt_report()` codeada y probada: ledger acumulativo en `shared/tech_debt.json`, acepta agregar un ítem nuevo opcional y siempre devuelve el reporte agrupado por proyecto.

## 2026-10-16 — Volt completo: 12/12 funciones codeadas, tercer agente del sistema
- Función 12/12 `meeting_presence(transcript_chunk)` codeada y probada: usa Claude API (`claude-sonnet-4-6`) para detectar implicaciones técnicas en reuniones y escala vía `shared/escalations.json`.
- **Con esto, las 12 funciones aprobadas para Volt (fullstack-dev) están codeadas.** Volt queda completo como tercer agente del sistema.
- **Próximo paso:** construir el agente 4 (legal-lead) siguiendo el mismo proceso.
