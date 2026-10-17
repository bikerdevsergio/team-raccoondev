# marketing-lead — Hermes

**Codename:** Hermes
**Rol:** Lead de Marketing de RaccoonDev
**Reporta a:** Sergi (CEO)
**Coordina con:** Dante (gg-raccoon), Midas (finance-lead) y Themis (legal-lead)
**Correo:** hermes@raccoondev.dev (SMTP propio, igual patrón que los otros agentes)
**Carpeta:** `marketing-lead/`

## Funciones aprobadas (11)

| # | Función | Descripción | Estado |
|---|---------|-------------|--------|
| 1 | `draft_post(spec)` | Genera copy para redes/blog vía Claude API (`claude-sonnet-4-6`), por canal (instagram/linkedin/twitter/blog) | ✅ codeado |
| 2 | `brand_voice_check(text)` | Revisa un texto contra `shared/marketing/config/brand_voice.json` (editable) vía Claude API | ✅ codeado |
| 3 | `content_calendar(entry)` | Calendario de contenido por canal/fecha en `shared/marketing/content_calendar.json`, con próximos 7 días | ✅ codeado |
| 4 | `campaign_tracker(entry)` | Registra campañas activas; el presupuesto se escribe también en `shared/finance/expenses.json` (categoría `marketing-campaña`), visible en `budget_report` de Midas | ✅ codeado |
| 5 | `lead_capture(entry)` | Registra leads entrantes en `shared/marketing/leads.json` | ✅ codeado |
| 6 | `seo_audit(url)` | Fetch + meta tags + headings (vía `cheerio`) de una URL, análisis de oportunidades vía Claude API | ✅ codeado |
| 7 | `flag_brand_risk(description)` | Congela comunicación riesgosa y escala a CEO vía `shared/escalations.json`; nunca decide sola | ✅ codeado |
| 8 | `generate_proposal(spec)` | Propuesta comercial en .docx + PDF (vía LibreOffice); si se pasa `costEstimateId`, usa el estimado real de Midas en vez de inventar cifras | ✅ codeado |
| 9 | `sync_status()` | Actualiza `shared/status/marketing-lead.json` (estado + escalaciones propias + leads nuevos) | ✅ codeado |
| 10 | `graphrag_sync()` | Nodo Neo4j propio (decisiones de marketing) — misma instancia AuraDB que los otros agentes | ✅ codeado |
| 11 | `meeting_presence(transcript_chunk)` | Detecta implicaciones de marketing en fragmentos de reunión (Claude API) y escala vía `shared/escalations.json` | ✅ codeado |

Cada función se propone (código mostrado al CEO, SIEMPRE antes de escribir, sin excepciones), se aprueba y recién ahí se escribe — una por una, en orden.

**Las 11 funciones aprobadas están codeadas.** Hermes queda completo como quinto y último agente del sistema.

## Memoria (GraphRAG)
Nodo propio en Neo4j AuraDB (misma instancia que Dante/Midas/Volt/Themis, `Agent {name: "hermes"}`). Credenciales en `marketing-lead/.env`. Falla explícitamente si faltan.

## Comunicación
Hermes coordina con Dante, Midas y Themis vía `shared/` (escalaciones, estado) — sin llamadas directas entre agentes.
