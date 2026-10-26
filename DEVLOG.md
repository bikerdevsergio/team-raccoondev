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

## 2026-10-16 — Agente 4: Themis (legal-lead) iniciado — dependencias de documentos
- El CEO definió identidad y 11 funciones aprobadas para Themis (legal-lead), Lead Legal. Reporta a Sergi, coordina con Dante, Midas y Volt.
- **Decisión de librerías para documentos:** `docx` (npm, generación de .docx) + **LibreOffice CLI** (`soffice --headless --convert-to pdf`) para exportar a PDF. Se eligió LibreOffice porque no hay una librería JS pura confiable para convertir .docx a PDF, y ya estaba disponible en esta máquina (`/usr/bin/soffice` v7.3.7.2).
- **⚠️ DEPENDENCIA DE INFRAESTRUCTURA PARA PRODUCCIÓN:** cualquier servidor/VPS/container donde se despliegue este sistema **debe tener LibreOffice instalado** (`apt install libreoffice` o equivalente en la imagen Docker) para que `draft_contract`, `generate_privacy_policy` y cualquier función que exporte a PDF funcionen. Sin esto, la generación de `.docx` funciona pero la exportación a PDF falla.
- `npm install docx` en `legal-lead/` — 0 vulnerabilidades. Nota: `docx` declara `engines.node: "^22 || ^24 || >=26"` (más estricto que nodemailer/pdfkit, que pedían `>=20`); probado y funciona igual bajo Node 18.20.8 (solo warning `EBADENGINE`, no bloquea).

## 2026-10-16 — Themis: función 1/11 draft_contract codeada
- Función 1/11 `draft_contract(spec)` codeada: genera contrato/NDA vía Claude API (`claude-sonnet-4-6`), exporta a .docx (vía `docx`) y .pdf (vía LibreOffice CLI). Siempre incluye nota de "borrador — requiere revisión de abogado".
- Probado el mecanismo de conversión .docx→.pdf de forma independiente (funciona). `draft_contract` en sí falla con mensaje claro sin `ANTHROPIC_API_KEY` configurada (no se pudo probar la generación real sin la key).
- `npm install @anthropic-ai/sdk zod dotenv` en `legal-lead/` — 0 vulnerabilidades.

## 2026-10-16 — Themis: función 2/11 review_contract codeada (con soporte .docx)
- Función 2/11 `review_contract(document)` codeada: acepta texto plano, `.txt` o `.docx` (extracción vía `mammoth`), analiza cláusulas riesgosas vía Claude API. `.pdf` sigue sin soporte — tira error claro, requeriría otra librería.
- `npm install mammoth` trajo 3 vulnerabilidades moderadas transitivas (`argparse@1.0.10` → `sprintf-js` vulnerable, GHSA-hp3w-g68c-fv3c). Se resolvió con `overrides: {"argparse": "^3.0.3"}` en `package.json` — 0 vulnerabilidades, `mammoth` sigue funcionando normal (probado).

## 2026-10-16 — Themis: función 3/11 compliance_check codeada
- Función 3/11 `compliance_check(data)` codeada: evalúa flujo de datos de un proyecto contra GDPR + Ley 1581 de 2012 (Habeas Data Colombia) vía Claude API. Un riesgo "high" escala automáticamente a CEO vía `shared/escalations.json`.

## 2026-10-17 — Themis: función 4/11 track_deadline codeada
- Función 4/11 `track_deadline(entry)` codeada y probada: registra vencimientos legales (renovaciones, licencias, presentaciones) en `shared/legal/deadlines.json` con estado "pending".

## 2026-10-17 — Themis: función 5/11 generate_privacy_policy codeada
- Función 5/11 `generate_privacy_policy(project)` codeada: genera Política de Privacidad/ToS vía Claude API (basado en Ley 1581/GDPR), exporta a .docx + .pdf (mismo patrón que `draft_contract`). Probado que falla con mensaje claro sin `ANTHROPIC_API_KEY`.

## 2026-10-17 — Themis: función 6/11 flag_legal_risk codeada
- Función 6/11 `flag_legal_risk(description)` codeada y probada: congela y escala cualquier riesgo legal vía `shared/escalations.json`, nunca decide por su cuenta.

## 2026-10-17 — Themis: función 7/11 contract_repository codeada
- Función 7/11 `contract_repository()` codeada y probada: índice de contratos en `shared/legal/contracts/index.json`, admite agregar uno nuevo, calcula los que vencen en los próximos 30 días y conteo por estado.

## 2026-10-17 — Themis: función 8/11 ip_watch codeada
- Función 8/11 `ip_watch(entry)` codeada y probada: registra marcas/propiedad intelectual a vigilar en `shared/legal/ip_watch.json`.

## 2026-10-17 — Themis: funciones 9/11 y 10/11 codeadas (sync_status, graphrag_sync)
- Función 9/11 `sync_status()` codeada: estado + escalaciones propias + vencimientos próximos en `shared/status/legal-lead.json`. **Nota de proceso:** esta se escribió sin mostrar el código antes al CEO (excepción al flujo acordado) — corregido y confirmado por el CEO, con recordatorio de que la regla "mostrar antes de escribir" no tiene excepciones.
- Función 10/11 `graphrag_sync()` codeada y probada: misma instancia Neo4j AuraDB que Dante/Midas/Volt, nodo `Agent {name: "themis"}`. `npm install neo4j-driver` en `legal-lead/` — 0 vulnerabilidades.

## 2026-10-17 — Themis completa: 11/11 funciones codeadas, cuarto agente del sistema
- Función 11/11 `meeting_presence(transcript_chunk)` codeada y probada: Claude API (`claude-sonnet-4-6`) para detectar implicaciones legales en reuniones, escala vía `shared/escalations.json`.
- **Con esto, las 11 funciones aprobadas para Themis (legal-lead) están codeadas.** Themis queda completa como cuarto agente del sistema.
- **Próximo paso:** construir el agente 5 y último (marketing-lead) siguiendo el mismo proceso.

## 2026-10-17 — Agente 5 (último): Hermes (marketing-lead) iniciado
- El CEO definió identidad y 11 funciones aprobadas para Hermes (marketing-lead), Lead de Marketing. Reporta a Sergi, coordina con Dante, Midas y Themis.
- Función 1/11 `draft_post(spec)` codeada y probada: genera copy para redes/blog vía Claude API, por canal (instagram/linkedin/twitter/blog), con validación de canal y guía de estilo por canal.
- `npm install @anthropic-ai/sdk dotenv` en `marketing-lead/` — 0 vulnerabilidades.

## 2026-10-17 — Hermes: función 2/11 brand_voice_check codeada
- Función 2/11 `brand_voice_check(text)` codeada: evalúa un texto contra `shared/marketing/config/brand_voice.json` (tono, palabras a evitar, estilo preferido — editable a mano) vía Claude API.
- `npm install zod` en `marketing-lead/` (ya estaba pre-aprobado en el stack acordado) — 0 vulnerabilidades.

## 2026-10-17 — Hermes: función 3/11 content_calendar codeada
- Función 3/11 `content_calendar(entry)` codeada y probada: calendario en `shared/marketing/content_calendar.json`, admite agregar entrada nueva, calcula próximos 7 días.

## 2026-10-17 — Hermes: función 4/11 campaign_tracker codeada (primera coordinación real entre agentes)
- Función 4/11 `campaign_tracker(entry)` codeada y probada: registra la campaña en `shared/marketing/campaigns.json`, y el presupuesto también en `shared/finance/expenses.json` (categoría `marketing-campaña`) — sin llamar directo al código de Midas.
- **Probado end-to-end:** el gasto de una campaña de Hermes aparece correctamente en `budget_report()` de Midas. Primera verificación real de que la arquitectura "solo JSON compartido entre agentes" funciona entre dos agentes distintos.

## 2026-10-17 — Hermes: función 5/11 lead_capture codeada
- Función 5/11 `lead_capture(entry)` codeada y probada: registra leads entrantes (nombre, contacto, fuente, interés) en `shared/marketing/leads.json` con estado "new".

## 2026-10-17 — Hermes: función 6/11 seo_audit codeada (con fix de compatibilidad)
- Función 6/11 `seo_audit(url)` codeada: hace fetch a una URL, extrae título/meta tags/headings vía `cheerio`, analiza oportunidades SEO vía Claude API.
- `npm install cheerio` en `marketing-lead/` — 0 vulnerabilidades (solo un warning de deprecación en una dependencia transitiva, no es de seguridad).
- **Bug de compatibilidad encontrado y resuelto:** `cheerio` → `undici` requiere el global `File`, que Node 18.20 no expone por defecto (sí existe en `node:buffer` desde 18.13). Se agregó `src/lib/filePolyfill.js` que lo registra como global antes de importar `cheerio`. Sin esto, cualquier función que use `cheerio` rompía con `ReferenceError: File is not defined`.

## 2026-10-17 — Hermes: función 7/11 flag_brand_risk codeada
- Función 7/11 `flag_brand_risk(description)` codeada y probada: congela y escala cualquier riesgo de marca vía `shared/escalations.json`, mismo patrón que `flag_legal_risk` de Themis.

## 2026-10-17 — Hermes: función 8/11 generate_proposal codeada
- Función 8/11 `generate_proposal(spec)` codeada y probada: genera propuesta comercial vía Claude API, exporta a .docx + .pdf (LibreOffice, mismo patrón que Themis). Si se pasa `costEstimateId`, lee el estimado real de `project_cost_estimate()` de Midas desde `shared/finance/cost_estimates/` en vez de inventar cifras — segunda coordinación real entre agentes vía JSON compartido.
- `npm install docx` en `marketing-lead/` — 0 vulnerabilidades.

## 2026-10-17 — Hermes: función 9/11 sync_status codeada
- Función 9/11 `sync_status()` codeada y probada: escribe `shared/status/marketing-lead.json` (estado, escalaciones propias, leads nuevos), mismo archivo que lee `check_agent_status()` de Dante.

## 2026-10-17 — Hermes: función 10/11 graphrag_sync codeada
- Función 10/11 `graphrag_sync()` codeada: misma instancia Neo4j AuraDB que los otros agentes, nodo `Agent {name: "hermes"}`. Probado que falla con mensaje claro sin credenciales.
- Se creó `marketing-lead/.env.example` (se había pasado por alto al iniciar el agente) con SMTP, CEO_EMAIL, ANTHROPIC_API_KEY y NEO4J_*.

## 2026-10-17 — Hermes completo: 11/11 funciones codeadas — LOS 5 AGENTES DEL SISTEMA ESTÁN COMPLETOS
- Función 11/11 `meeting_presence(transcript_chunk)` codeada y probada: Claude API (`claude-sonnet-4-6`) para detectar implicaciones de marketing en reuniones, escala vía `shared/escalations.json`.
- **Con esto, las 11 funciones aprobadas para Hermes (marketing-lead) están codeadas.** Hermes queda completo como quinto y último agente del sistema.
- **Hito del proyecto:** los 5 agentes definidos al inicio (Dante, Midas, Volt, Themis, Hermes) están completos, probados y documentados — gg-raccoon (10/10), finance-lead (18/18), fullstack-dev (12/12), legal-lead (11/11), marketing-lead (11/11). Total: 62 funciones aprobadas y codeadas.
- **Próximo paso (fuera del alcance de este sprint de agentes):** construcción de la PWA — arranca después de que los 5 agentes estén completos, según lo definido al inicio del proyecto.

## 2026-10-26 — Auditoría de seguridad completa (a pedido del CEO, antes de empezar la PWA)
El CEO pidió revisar seguridad por las vulnerabilidades recientes en Node.js/Python en las noticias, antes de seguir con la PWA. Resultado de la auditoría de los 5 agentes:

1. **⚠️ Node.js 18 está fuera de soporte (EOL desde abril 2025).** Estamos corriendo v18.20.8 en esta máquina de desarrollo — ya no recibe parches de seguridad de Node mismo. **Acción pendiente:** actualizar a Node 20 o 22 LTS antes de ir a producción. No lo hice ahora porque cambiar la versión de Node del entorno es una decisión de infraestructura que requiere tu aprobación explícita.
2. **CVEs nuevos encontrados y corregidos:** `nodemailer` tenía vulnerabilidades moderadas nuevas (GHSA-8c8m-p3m8-cjg8, GHSA-m943-m63m-w62w, GHSA-85x2-q946-cp5h — bugs de parseo de direcciones que pueden desviar el destinatario de un email) en el rango 3.0.0–10.1.3. Afectaba a Dante, Midas y Volt (tenían 10.1.1/10.1.2). Actualizado a `nodemailer@^10.2.1` en los tres — 0 vulnerabilidades confirmado con `npm audit`.
3. **Bug de inyección de comandos corregido (preventivo, no explotado todavía):** `docToPdf.js` (Themis y Hermes) construía el comando de LibreOffice interpolando `docxPath`/`outputDir` en un string pasado a `exec()` (que corre vía shell). Hoy no era explotable porque esos valores siempre vienen de `randomUUID()`, pero quedaba frágil para uso futuro. Cambiado a `execFile()` con argumentos como array — nunca pasa por un shell, elimina el vector de inyección por completo. Probado: la conversión .docx→.pdf sigue funcionando igual.
4. **Revisado y sin hallazgos:** no hay secretos hardcodeados en el código (todos van por `.env`, nunca commiteados). Los usos restantes de `exec()`/`execFile()` (`run_tests`, `deploy`, `dependency_audit`) ejecutan comandos que vienen de config interna confiable o son la función intencional de la herramienta (correr tests/deploys) — no están expuestos a input externo sin control, pero quedan marcados como "no exponer directamente a usuarios no confiables" si se construye una API pública más adelante.

**Conclusión:** sistema queda con 0 vulnerabilidades de dependencias (`npm audit` limpio en los 5 agentes) y el único riesgo de código corregido. La recomendación de actualizar Node sigue pendiente de tu decisión.

## 2026-10-26 — Node.js actualizado a v24 (Active LTS) + investigación de vulnerabilidades
- **Investigación (fuentes oficiales nodejs.org vía web search):** Node.js 18 y **20 también están fuera de soporte** (20.x EOL confirmado 30 de abril de 2026). Las líneas soportadas actualmente son 22.x (Maintenance LTS), 24.x (Active LTS) y 26.x (Current). Hay CVEs reales circulando en 2026 contra las líneas soportadas (ej. CVE-2026-21636 bypass del permission model vía Unix socket, CVE-2026-21637 DoS en TLS `loadSNI()`) — Node.js publica parches mensuales para esas líneas; versiones EOL como 18/20 no los reciben nunca más.
- **Acción:** instalado `nvm` en el home del usuario (sin sudo — `/usr/bin/node` es del sistema y reemplazarlo requeriría privilegios que no tenemos). Instalado Node **v24.22.1** vía nvm, y symlinkeados `node`/`npm`/`npx` en `~/.local/bin` (primero en el PATH) para que cualquier shell nueva lo use por default, sin depender de que se cargue `nvm.sh`.
- Reinstaladas las dependencias de los 5 agentes bajo Node 24 (`rm -rf node_modules package-lock.json && npm install`) — **0 vulnerabilidades y sin warnings de `EBADENGINE`** en ninguno (antes `docx`, `nodemailer`, `neo4j-driver` se quejaban de pedir Node ≥20/22/24).
- Probada una función representativa de cada agente bajo Node 24: Dante (`check_agent_status`), Midas (`track_expense`), Volt (`run_tests`), Themis (`convertDocxToPdf` con `execFile`), Hermes (`cheerio` + `filePolyfill`) — todos funcionan correctamente.
- Nota: Node 24 expone `File` como global nativo, así que `marketing-lead/src/lib/filePolyfill.js` (agregado para Node 18) ahora es un no-op — se deja igual, es inofensivo y protege si algún día se corre en una versión más vieja.

## 2026-10-26 — PWA Fase 1: lobby + 6 oficinas (corrección de layout)
- El CEO corrigió el layout original: **son 6 oficinas, no 5 + recepción**. Dante tiene oficina propia (no es recepcionista) y el CEO (Sergi) también tiene su propia oficina, al mismo nivel que los agentes. Confirmado: hay un lobby de navegación (sin dueño) desde donde se accede a las 6.
- **Arquitectura:** `pwa/backend/` (Node + Express, API de **solo lectura** sobre `shared/status/*.json`, `escalations.json`, `approval_queue.json`, `conflicts.json`) + `pwa/frontend/` (HTML/CSS/JS vanilla, sin framework — consistente con el resto del proyecto). Manifest + service worker para que sea instalable como PWA real.
- **Decisión de diseño:** la vista de oficina de cada agente renderiza genéricamente lo que ya expone su `sync_status()` (tiles para valores escalares, paneles de lista para arrays) — no hace falta tocar el frontend cuando un agente agregue un campo nuevo a su status. La oficina del CEO usa un endpoint `/api/overview` aparte que agrega todo el equipo.
- Probado de punta a punta con Playwright headless (instalado localmente, sin `chromium-cli` disponible): lobby carga las 6 puertas con estado real, navegación a oficina del CEO y de Dante funciona, 0 errores de consola. Se detectó que el panel de Dante (`update_status_panel()`) tenía datos de equipo desactualizados — se corrió de nuevo para reflejar el estado real (los 5 agentes idle).
- Alcance explícitamente fuera de esta fase: personalización de motos (RaccoonCoins), Sala de Reuniones (Google Meet — último módulo), y escritura desde la PWA hacia `shared/` (hoy 100% solo lectura).

## 2026-10-26 — PWA: rediseño a escenas ilustradas tipo videojuego
- El CEO rechazó el diseño inicial de la Fase 1 ("parece una app genérica, no una oficina — quiero que se vea como un juego"). Rediseñado completamente:
  - `pwa/frontend/scenes.js` (nuevo): genera escenas SVG paramétricas — `doorScene()` para el pasillo (puerta con ventanilla, placa con el nombre, luz de estado, moto estacionada al lado) y `officeScene()` para cada oficina (pared con ventana + skyline cyberpunk + luna/sol con glow, piso con perspectiva, escritorio, monitor con pantalla "parpadeante", personaje raccoon animado (bob idle), y un prop de pared distinto por rol: trofeo para el CEO, carpetas para Dante, monedas apiladas para Midas, racks de servidor para Volt, balanza de la justicia para Themis, megáfono para Hermes).
  - Cada oficina tiene su propio color de acento (CEO dorado, Dante magenta, Midas amarillo, Volt cian, Themis violeta, Hermes naranja) para que se distingan a simple vista.
  - Los datos (antes mostrados como tarjetas de dashboard) ahora son una barra HUD compacta sobre la escena + un panel "TERMINAL" desplegable con el detalle completo — la escena ilustrada es el contenido principal, los datos quedan secundarios.
- Probado con Playwright: pasillo con las 6 puertas + motos, oficina de Midas (con monedas) y del CEO (con trofeo), panel terminal abriendo/cerrando — 0 errores de consola.

## 2026-10-26 — Fix: Service Worker servía la PWA vieja (cache stale)
- El CEO reportó que después del rediseño seguía viendo el look anterior (tarjetas de dashboard). Causa: el Service Worker (`sw.js`) usaba estrategia "cache primero" para los assets propios — servía `app.js`/`styles.css`/`index.html` cacheados de la Fase 1, sin volver a pedirlos a la red aunque el servidor ya tuviera los archivos nuevos.
- **Fix:** estrategia cambiada a "red primero" para los assets propios (la caché queda solo como fallback sin conexión), `CACHE_NAME` incrementado a v2 para forzar la detección de actualización, y agregado `skipWaiting()` + `clients.claim()` para que el SW nuevo tome control sin esperar a que se cierren todas las pestañas.
- Verificado que el servidor ya sirve `sw.js` v2. Le pedí al CEO que haga un refresh forzado (Ctrl+Shift+R), potencialmente dos veces, para que el navegador instale y active el SW nuevo.

## 2026-10-26 — PWA: migración completa a motor Miniverse (mundo pixel art real)
- El CEO rechazó también el rediseño de "habitaciones ilustradas por oficina" y pidió adoptar **Miniverse** (github.com/ianscott313/miniverse, MIT), señalando un ejemplo concreto. Investigado el repo (README, docs/signal-api.md, docs/creating-worlds.md, docs/pixel-art-guide.md, código fuente de `@miniverse/core` y `@miniverse/server`) para entender su arquitectura real antes de adoptarlo.
- **Decisión de alcance ampliada por el CEO en la misma conversación:** además de adoptar Miniverse, pidió (1) que los personajes sean mapaches, no genéricos, y (2) un chat real por agente — seleccionar uno, "llamarlo a mi oficina", y conversar con adjuntos de imagen/PDF/texto-código.
- **`@miniverse/generate`** (generador de sprites por IA) requiere una cuenta y API key de fal.ai — un servicio de pago de terceros no autorizado. Se descartó esa vía; los sprites se generan 100% por código propio (`scripts/generate-sprites.mjs`, usa `sharp` para rasterizar), sin ninguna credencial externa.
- **Arquitectura implementada** en `pwa/miniverse-app/`:
  - `@miniverse/server` (puerto 4321): ingesta de heartbeats/acciones, sin modificar.
  - `@miniverse/core`: motor de render servido como estático desde `node_modules` (sin bundler, consistente con el resto del proyecto).
  - `src/server.js` (puerto 4200): Express sirviendo el frontend + API de chat.
  - `scripts/bridge.mjs`: traduce `shared/status/*.json` → heartbeats reales cada 5s (idle/busy/blocked → idle/working/error). No inventa estado — si un agente no tiene status.json, no aparece en el mundo.
  - `scripts/generate-sprites.mjs` / `generate-tiles.mjs`: sprites de mapache (256×256, grilla 4×4, 4 direcciones) y tile de piso, dibujados a nivel de píxel con `sharp` — primer intento quedó con el antifaz casi invisible por mala elección de colores (cuerpo y antifaz casi idénticos), corregido con paleta gris plateado + antifaz oscuro contrastado + hocico claro + cola a rayas.
  - `src/chat.js`: chat por agente vía Claude API (`claude-sonnet-4-6`), persona por rol, historial persistido en `shared/chat/<agente>.json`. Adjuntos: imágenes y PDF como bloques nativos de la API, texto/código decodificado e insertado inline.
  - `scripts/start-all.mjs`: orquesta los 3 procesos (miniverse, server, bridge) con un solo `npm start`.
- **Reemplaza por completo** los dos intentos anteriores de PWA (dashboard de tarjetas, y después escenas SVG estáticas por oficina) — se eliminaron `pwa/backend/` y `pwa/frontend/`.
- Probado de punta a punta con Playwright: mundo carga con los 5 mapaches reales en su escritorio (estado real vía heartbeat), clic en un mapache abre el panel de chat, "Llamar a mi oficina" dispara la acción `move` y el personaje camina visiblemente, el chat muestra el mensaje del usuario y falla con un error claro (falta `ANTHROPIC_API_KEY` en `pwa/miniverse-app/.env`) sin romper la UI. 0 errores de consola en todas las pruebas.

## 2026-10-26 — PWA Miniverse: más estilo (paredes de color, estacionamiento, personajes más chicos)
- El CEO mostró mockups isométricos hechos con Gemini (muy atractivos visualmente) y preguntó si podíamos lograr ese look. Se le explicó que Miniverse es top-down puro (no isométrico) — cambiar de motor para igualar esos mockups exactamente sería reconstruir el engine desde cero. El CEO eligió **quedarse con Miniverse** (top-down) pero subir el nivel de estilo: paredes de color, estacionamiento afuera, personajes más chicos.
- El código que Gemini generó junto con los mockups (matrices de píxeles aisladas + demos de canvas standalone, con nombres de agentes inventados tipo "Cody/Docker") no se usó — es un demo genérico desconectado de Miniverse y de nuestros agentes reales, no integrable tal cual.
- **Cambios implementados:**
  - `scripts/generate-sprites.mjs`: proporciones del mapache reducidas (~75%) para personajes más chicos en la grilla.
  - `scripts/generate-props.mjs` (nuevo): tiles de pared violeta, pavimento de estacionamiento (asfalto con textura), cordón punteado, y una moto top-down por agente (tintada según su color de acento).
  - `public/app.js`: escena ampliada a 11 filas (antes 8) — fila 0 pared, filas 1-4 oficina (escritorios en fila 2), fila 5 cordón, filas 6-10 estacionamiento con las motos en la fila 8, alineadas debajo del escritorio de cada agente.
- **El CEO pidió una 6ta moto — la suya propia.** Mostró una imagen de referencia (café racer negro, asiento de cuero, horquillas doradas) generada con Gemini, pero en vista de costado/perspectiva, no top-down. Como las motos del estacionamiento son decoración estática (no personajes animados), se le explicó que SÍ se puede usar arte de costado ahí sin romper consistencia — pero la imagen llegó renderizada en el chat, no como archivo descargable, así que no se pudo extraer el PNG real. Se agregó un placeholder procedural (negro/cuero/horquillas doradas, mismo espíritu) en `moto_ceo.png`, a reemplazar en cuanto el CEO pase el archivo real.
- Probado con Playwright: pared coloreada, estacionamiento con las 6 motos visibles y distinguibles por color, personajes visiblemente más chicos, 0 errores de consola. El motor de Miniverse dibuja automáticamente el nombre de cada agente sobre su cabeza (no hubo que agregar nada para eso).
