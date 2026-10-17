# legal-lead — Themis

**Codename:** Themis
**Rol:** Lead Legal de RaccoonDev
**Reporta a:** Sergi (CEO)
**Coordina con:** Dante (gg-raccoon), Midas (finance-lead) y Volt (fullstack-dev)
**Correo:** themis@raccoondev.dev (SMTP propio, igual patrón que los otros agentes)
**Carpeta:** `legal-lead/`

## Formato de documentos
Output primario: **.docx** (editable, vía librería `docx`). Toda función que genera un documento también exporta a **.pdf** usando LibreOffice CLI (`soffice --headless --convert-to pdf`), ya instalado en esta máquina. **Ambos quedan en `shared/legal/documents/`.**

**⚠️ Dependencia de infraestructura:** cualquier servidor de producción donde corra esto necesita LibreOffice instalado (`apt install libreoffice`) — sin eso, el `.docx` se genera igual pero la exportación a PDF falla (sin romper el flujo, ver `docToPdf.js`).

## Funciones aprobadas (11)

| # | Función | Descripción | Estado |
|---|---------|-------------|--------|
| 1 | `draft_contract(spec)` | Genera contrato/NDA vía Claude API (`claude-sonnet-4-6`), exporta a .docx + .pdf | ✅ codeado |
| 2 | `review_contract(document)` | Revisa contrato (texto, `.txt` o `.docx` vía `mammoth`) buscando cláusulas riesgosas, vía Claude API; `.pdf` todavía sin soporte | ✅ codeado |
| 3 | `compliance_check(data)` | Verifica flujo de datos contra GDPR/Habeas Data Colombia (Ley 1581 de 2012); riesgo "high" escala automáticamente | ✅ codeado |
| 4 | `track_deadline(entry)` | Registra vencimientos legales en `shared/legal/deadlines.json` | ✅ codeado |
| 5 | `generate_privacy_policy(project)` | Genera política de privacidad/ToS vía Claude API, exporta a .docx + .pdf | ✅ codeado |
| 6 | `flag_legal_risk(description)` | Congela situación riesgosa y escala a CEO vía `shared/escalations.json`; nunca decide sola | ✅ codeado |
| 7 | `contract_repository()` | Índice de contratos en `shared/legal/contracts/index.json`: partes, estado, vencimiento, alerta de próximos a vencer (30 días) | ✅ codeado |
| 8 | `ip_watch(entry)` | Registra marcas/propiedad intelectual a vigilar en `shared/legal/ip_watch.json` | ✅ codeado |
| 9 | `sync_status()` | Actualiza `shared/status/legal-lead.json` (estado + escalaciones propias + vencimientos próximos) | ✅ codeado |
| 10 | `graphrag_sync()` | Nodo Neo4j propio (decisiones legales, no el texto completo de contratos) — misma instancia AuraDB que los otros agentes | ✅ codeado |
| 11 | `meeting_presence(transcript_chunk)` | Detecta implicaciones legales en fragmentos de reunión (Claude API) y escala vía `shared/escalations.json` | ✅ codeado |

Cada función se propone (código mostrado al CEO), se aprueba y recién ahí se escribe — una por una, en orden.

**Las 11 funciones aprobadas están codeadas.** Themis queda completa como cuarto agente del sistema.

## Memoria (GraphRAG)
Nodo propio en Neo4j AuraDB (misma instancia que Dante/Midas/Volt, `Agent {name: "themis"}`) — se conecta en la función 10.

## Comunicación
Themis coordina con Dante, Midas y Volt vía `shared/` (escalaciones, estado) — sin llamadas directas entre agentes.
