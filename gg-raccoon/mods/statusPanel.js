import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkAgentStatus } from "../src/functions/checkAgentStatus.js";
import { listApprovalQueue } from "../src/functions/approvalQueue.js";
import { listEscalations } from "../src/functions/escalateToCeo.js";
import { listConflicts } from "../src/functions/conflictResolver.js";

const MODS_DIR = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(MODS_DIR, "status_panel.html");

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function renderList(items, emptyLabel) {
  if (!items.length) return `<li class="empty">${emptyLabel}</li>`;
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n");
}

function stateClass(state) {
  if (state === "idle") return "ok";
  if (state === "busy") return "warn";
  if (state === "blocked") return "crit";
  return "neutral";
}

function buildHtml(data) {
  const dante = data.statuses.find((s) => s.agent === "gg-raccoon") ?? { state: "unknown" };

  const alertCount = data.pendingApprovals.length + data.pendingEscalations.length + data.frozenConflicts.length;
  const generatedDate = new Date(data.generatedAt);
  const generatedLabel = generatedDate.toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Panel de Dante</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Orbitron:wght@600;800&family=JetBrains+Mono:wght@400;500;600&display=swap">
<style>
  :root {
    color-scheme: dark;
    --bg: #0b0c14;
    --bg-raised: #13141f;
    --bg-raised-2: #1a1c2b;
    --line: #272a3d;
    --text: #dfe6f3;
    --text-dim: #7d84a3;
    --accent: #ff3fa0;
    --accent-glow: #ff3fa055;
    --accent-2: #39e6ff;
    --ok: #3de893;
    --warn: #ffcc4d;
    --crit: #ff5470;
    --neutral: #5a6080;
    --font-display: "Orbitron", "Segoe UI", sans-serif;
    --font-mono: "JetBrains Mono", "Courier New", monospace;
  }

  * { box-sizing: border-box; }

  body {
    margin: 0; padding: 40px 20px 32px; min-height: 100vh;
    background:
      radial-gradient(ellipse 900px 500px at 15% -10%, #1d1030 0%, transparent 60%),
      radial-gradient(ellipse 700px 400px at 100% 0%, #061f26 0%, transparent 55%),
      var(--bg);
    color: var(--text);
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
  }

  .wrap { max-width: 920px; margin: 0 auto; }

  header {
    display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between;
    gap: 12px 24px; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid var(--line);
  }
  .brand h1 {
    font-family: var(--font-display); font-weight: 800; font-size: clamp(1.9rem, 5vw, 2.6rem);
    letter-spacing: 3px; margin: 0; color: var(--text);
    text-shadow: 0 0 18px var(--accent-glow), 0 0 2px var(--accent);
  }
  .brand .role { color: var(--accent-2); font-size: 0.85rem; letter-spacing: 1px; margin-top: 4px; }
  .brand .org { color: var(--text-dim); font-size: 0.8rem; }

  .pill {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 7px 14px; border-radius: 999px; font-size: 0.78rem;
    letter-spacing: 1px; text-transform: uppercase; white-space: nowrap;
    border: 1px solid var(--line); background: var(--bg-raised);
  }
  .pill .dot { width: 8px; height: 8px; border-radius: 50%; box-shadow: 0 0 8px currentColor; }
  .pill.ok { color: var(--ok); } .pill.ok .dot { background: var(--ok); }
  .pill.warn { color: var(--warn); } .pill.warn .dot { background: var(--warn); }
  .pill.crit { color: var(--crit); } .pill.crit .dot { background: var(--crit); }
  .pill.neutral { color: var(--neutral); } .pill.neutral .dot { background: var(--neutral); }

  .headline-bar {
    display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px 16px;
    margin-bottom: 24px;
  }
  .headline-bar .summary { color: var(--text-dim); font-size: 0.85rem; }
  .headline-bar .summary strong { color: var(--text); }

  section {
    background: var(--bg-raised); border: 1px solid var(--line); border-radius: 10px;
    padding: 18px 20px; margin-bottom: 18px;
  }
  section h2 {
    font-family: var(--font-display); font-weight: 600; font-size: 0.82rem;
    text-transform: uppercase; letter-spacing: 2px; color: var(--accent-2);
    margin: 0 0 14px; display: flex; align-items: center; justify-content: space-between;
  }
  section h2 .count { color: var(--text-dim); font-family: var(--font-mono); letter-spacing: 0; }

  .agent-grid { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); }
  .agent-card {
    background: var(--bg-raised-2); border: 1px solid var(--line); border-radius: 8px;
    padding: 12px 14px; display: flex; flex-direction: column; gap: 6px;
  }
  .agent-card .name { font-weight: 600; font-size: 0.92rem; }
  .agent-card .task { color: var(--text-dim); font-size: 0.78rem; overflow-wrap: anywhere; }

  ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
  li {
    padding: 10px 12px; border-radius: 6px; background: var(--bg-raised-2);
    border-left: 3px solid var(--line); font-size: 0.85rem; overflow-wrap: anywhere;
  }
  li.empty { color: var(--text-dim); font-style: italic; border-left-color: transparent; background: transparent; padding-left: 0; }
  section.approvals li { border-left-color: var(--warn); }
  section.escalations li { border-left-color: var(--accent); }
  section.conflicts li { border-left-color: var(--crit); }

  footer {
    color: var(--text-dim); font-size: 0.75rem; margin-top: 28px;
    text-align: center; letter-spacing: 0.5px;
  }
  footer code { color: var(--accent-2); }

  @media (max-width: 480px) {
    body { padding: 28px 14px 24px; }
    header { flex-direction: column; align-items: flex-start; }
  }
</style>
</head>
<body>
  <div class="wrap">
    <header>
      <div class="brand">
        <h1>DANTE</h1>
        <div class="role">Gerente General de RaccoonDev</div>
        <div class="org">nodo · gg-raccoon</div>
      </div>
      <span class="pill ${stateClass(dante.state)}"><span class="dot"></span>${escapeHtml(dante.state)}</span>
    </header>

    <div class="headline-bar">
      <span class="summary">${alertCount === 0
        ? "Sin pendientes — todo tranquilo."
        : `<strong>${alertCount}</strong> ítem(s) necesitan tu atención.`}</span>
    </div>

    <section>
      <h2>Estado del equipo <span class="count">${data.statuses.length} agentes</span></h2>
      <div class="agent-grid">
        ${data.statuses
          .map(
            (s) => `<div class="agent-card">
              <span class="name">${escapeHtml(s.agent)}</span>
              <span class="pill ${stateClass(s.state)}"><span class="dot"></span>${escapeHtml(s.state)}</span>
              <span class="task">${s.currentTask ? escapeHtml(s.currentTask) : "sin tarea activa"}</span>
            </div>`
          )
          .join("\n")}
      </div>
    </section>

    <section class="approvals">
      <h2>Aprobaciones pendientes <span class="count">${data.pendingApprovals.length}</span></h2>
      <ul>${renderList(data.pendingApprovals.map((a) => a.title), "Sin aprobaciones pendientes")}</ul>
    </section>

    <section class="escalations">
      <h2>Escalaciones esperando al CEO <span class="count">${data.pendingEscalations.length}</span></h2>
      <ul>${renderList(data.pendingEscalations.map((e) => e.title), "Sin escalaciones pendientes")}</ul>
    </section>

    <section class="conflicts">
      <h2>Conflictos congelados <span class="count">${data.frozenConflicts.length}</span></h2>
      <ul>${renderList(data.frozenConflicts.map((c) => c.agentsInvolved.join(" vs ") + ": " + c.description), "Sin conflictos activos")}</ul>
    </section>

    <footer>snapshot generado ${escapeHtml(generatedLabel)} · se regenera corriendo <code>renderStatusPanel()</code></footer>
  </div>
</body>
</html>
`;
}

/**
 * Mod de UI: genera un panel HTML estático con el estado actual de Dante
 * (estado del equipo, cola de aprobaciones, escalaciones y conflictos).
 * Semilla visual para la futura recepción de la PWA.
 * @returns {Promise<{ path: string }>}
 */
export async function renderStatusPanel() {
  const [statuses, pendingApprovals, pendingEscalations, frozenConflicts] = await Promise.all([
    checkAgentStatus(),
    listApprovalQueue("pending"),
    listEscalations("awaiting_ceo"),
    listConflicts("frozen"),
  ]);

  const data = {
    generatedAt: new Date().toISOString(),
    statuses,
    pendingApprovals,
    pendingEscalations,
    frozenConflicts,
  };

  const html = buildHtml(data);
  await writeFile(OUTPUT_PATH, html, "utf-8");

  return { path: OUTPUT_PATH };
}
