# finance-lead — Midas

**Codename:** Midas
**Rol:** Lead de Finanzas de RaccoonDev
**Reporta a:** Sergi (CEO)
**Coordina con:** Dante (gg-raccoon)
**Correo:** midas@raccoondev.dev (SMTP propio, igual patrón que Dante)
**Carpeta:** `finance-lead/`

## Funciones aprobadas (18)

| # | Función | Descripción | Estado |
|---|---------|-------------|--------|
| 1 | `track_expense(entry)` | Registra gasto en `shared/finance/expenses.json` | ✅ codeado |
| 2 | `track_income(entry)` | Registra ingreso en `shared/finance/income.json` (requiere `clientId`) | ✅ codeado |
| 3 | `budget_report(period)` | Reporte ingresos vs gastos por período y categoría | ✅ codeado |
| 4 | `flag_large_expense(entry, threshold)` | Congela gasto grande y escala a CEO vía `shared/escalations.json` (mismo canal que usa Dante) | ✅ codeado |
| 5 | `payment_reminder(invoice)` | Email de cobro al cliente vía SMTP de Midas, firmado como "Equipo RaccoonDev" (el cliente no debe saber que es un agente) | ✅ codeado |
| 6 | `generate_invoice(data)` | Genera factura en PDF (el que se envía al cliente) + .txt/.json (registro interno), vía `pdfkit` (requiere `clientId`) | ✅ codeado |
| 7 | `tax_summary(period)` | Resumen para contador/impuestos (ingreso, gasto deducible, base imponible estimada) | ✅ codeado |
| 8 | `sync_status()` | Actualiza `shared/status/finance-lead.json` (mismo archivo que lee `check_agent_status` de Dante) | ✅ codeado |
| 9 | `graphrag_sync()` | Nodo Neo4j propio (decisiones financieras, no el ledger completo) — misma instancia AuraDB que Dante | ✅ codeado |
| 10 | `project_cost_estimate(project)` | Proyecta costos reales (mano de obra vía `shared/finance/config/rates.json` + costos fijos) y precio sugerido antes de cotizar | ✅ codeado |
| 11 | `rentability_check(project)` | Evalúa rentabilidad; cancela por default y escala a CEO si no alcanza el margen mínimo (mismo canal que `flag_large_expense`) | ✅ codeado |
| 12 | `service_inventory()` | Inventario de servicios activos (`shared/finance/config/services.json`, editable a mano) con costo total y alertas por umbral | ✅ codeado |
| 13 | `portfolio_manager()` | Cartera de clientes: deuda, pagos, historial — matcheado por `clientId` (no por nombre) | ✅ codeado |
| 14 | `suspend_service(client)` | Propone suspensión por no pago (consulta deuda vía `portfolio_manager`); NUNCA ejecuta, solo escala a CEO | ✅ codeado |
| 15 | `payroll()` | Nómina: propone pago en COP a Sergi y escala para confirmación manual (sin integración bancaria real); guarda plan de RaccoonCoins para cuando exista `raccoin_ledger` | ✅ codeado |
| 16 | `raccoin_ledger(agent, amount)` | Moneda virtual interna (RaccoonCoins) — solo personalización de moto en PWA, sin valor monetario real, sin conversión a dinero, sin balance negativo | ✅ codeado |
| 17 | `financial_growth()` | Mide crecimiento del colchón acumulado (ingresos - gastos históricos) vs. snapshot anterior | ✅ codeado |
| 18 | `meeting_presence(transcript_chunk)` | Detecta implicaciones financieras en fragmentos de reunión (Claude API) y escala vía `shared/escalations.json` (comunica a Dante sin llamada directa) | ✅ codeado |

Cada función se propone (código mostrado al CEO), se aprueba y recién ahí se escribe — una por una, en orden.

**Las 18 funciones aprobadas están codeadas.** Midas queda completo como segundo agente del sistema.

## Memoria (GraphRAG)
Nodo propio en Neo4j AuraDB (misma instancia que Dante, nodos `Agent`/`Decision` separados por agente: `Agent {name: "midas"}`). Credenciales en `finance-lead/.env` (mismas que `gg-raccoon/.env`, ver `.env.example`). Falla explícitamente si faltan.

## Comunicación
Midas lee/escribe en `shared/finance/` y coordina con Dante vía `shared/status/` y `shared/escalations.json` (mismo archivo que usa `escalate_to_ceo` de Dante — sin llamadas directas entre agentes, solo JSON compartido).

## Moneda y umbrales
- **Moneda base:** USD (`BASE_CURRENCY` en `.env`). Todos los montos del sistema se registran en USD.
- **Umbral de gasto grande:** `EXPENSE_THRESHOLD` en `.env` (default sugerido: 1000), usado por `flag_large_expense`.

## Email (igual patrón que Dante)
Midas tiene su propio correo (`midas@raccoondev.dev`, redirigido vía Cloudflare) para `payment_reminder`. Credenciales SMTP en `finance-lead/.env` (ver `.env.example`).

## Tarifas estándar
`shared/finance/config/rates.json` — tarifas por rol en USD/hora (CEO, dev, diseño, consultoría), editable a mano sin tocar código. `project_cost_estimate` las usa cuando no se especifica `hourlyRate` explícito.
