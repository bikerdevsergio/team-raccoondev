import { doorScene, officeScene } from "./scenes.js";

const OFFICES = [
  { id: "ceo", name: "Sergi", role: "CEO", icon: "👑", accent: "#ffcc4d" },
  { id: "gg-raccoon", name: "Dante", role: "Gerente General", icon: "🗂️", accent: "#ff3fa0" },
  { id: "finance-lead", name: "Midas", role: "Lead de Finanzas", icon: "💰", accent: "#f3d978" },
  { id: "fullstack-dev", name: "Volt", role: "CTO", icon: "💻", accent: "#39e6ff" },
  { id: "legal-lead", name: "Themis", role: "Lead Legal", icon: "⚖️", accent: "#b388ff" },
  { id: "marketing-lead", name: "Hermes", role: "Lead de Marketing", icon: "📣", accent: "#ff7a59" },
];

const LABELS = {
  team: "Equipo",
  pendingApprovals: "Aprobaciones pendientes",
  pendingEscalations: "Escalaciones pendientes",
  frozenConflicts: "Conflictos congelados",
  pendingExpenseEscalations: "Escalaciones de gasto pendientes",
  openBugs: "Bugs abiertos",
  upcomingDeadlines: "Vencimientos próximos",
  newLeads: "Leads nuevos",
};

function humanize(key) {
  if (LABELS[key]) return LABELS[key];
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

function stateClass(state) {
  if (state === "idle") return "ok";
  if (state === "busy") return "warn";
  if (state === "blocked") return "crit";
  return "neutral";
}

function officeFor(id) {
  return OFFICES.find((o) => o.id === id) ?? { id, name: id, role: "", icon: "🚪", accent: "#5a6080" };
}

function pillHtml(state) {
  return `<span class="pill ${stateClass(state)}"><span class="dot"></span>${state}</span>`;
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function renderLobby(container, teamStatuses) {
  const stateById = Object.fromEntries((teamStatuses ?? []).map((s) => [s.agent, s.state]));

  container.innerHTML = `
    <div class="lobby-header">
      <h1>RACCOONDEV HQ</h1>
      <p>Elegí una oficina</p>
    </div>
    <div class="hallway">
      ${OFFICES.map((o) => {
        const state = o.id === "ceo" ? "ok" : stateById[o.id] ?? "unknown";
        return `
          <button class="door-btn" data-office="${o.id}" aria-label="Entrar a la oficina de ${o.name}">
            ${doorScene({ name: o.name, icon: o.icon, state })}
          </button>
        `;
      }).join("")}
    </div>
  `;

  container.querySelectorAll(".door-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      location.hash = `#office/${btn.dataset.office}`;
    });
  });
}

function renderStatList(items, emptyLabel, itemRenderer) {
  if (!items || items.length === 0) return `<ul class="item-list"><li class="empty">${emptyLabel}</li></ul>`;
  return `<ul class="item-list">${items.map(itemRenderer).join("")}</ul>`;
}

function renderAgentGrid(team) {
  return `<div class="agent-grid">${team
    .map((s) => {
      const office = officeFor(s.agent);
      return `<div class="agent-card">
        <span class="name">${office.icon} ${office.name}</span>
        ${pillHtml(s.state)}
      </div>`;
    })
    .join("")}</div>`;
}

function describeItem(item) {
  if (typeof item === "string") return item;
  return item.title ?? item.description ?? item.name ?? JSON.stringify(item);
}

function hudBadge(value, label) {
  return `<div class="hud-badge"><span class="hud-value">${value}</span><span class="hud-label">${label}</span></div>`;
}

function wireOfficeChrome(container, office) {
  container.querySelector("#back").addEventListener("click", () => {
    location.hash = "#lobby";
  });
  const terminalBtn = container.querySelector("#open-terminal");
  const terminal = container.querySelector(".terminal");
  if (terminalBtn && terminal) {
    terminalBtn.addEventListener("click", () => terminal.classList.toggle("open"));
    terminal.querySelector(".terminal-close")?.addEventListener("click", () => terminal.classList.remove("open"));
  }
}

function renderCeoOffice(container, data) {
  const office = officeFor("ceo");
  const idleCount = data.team.filter((t) => t.state === "idle").length;

  container.innerHTML = `
    <button class="back-btn" id="back">&larr; Volver al pasillo</button>
    <div class="scene-wrap" style="--accent:${office.accent}">
      ${officeScene({ officeId: office.id, accent: office.accent, icon: office.icon })}
      <div class="scene-caption">
        <span class="icon">${office.icon}</span>
        <div><h1>${office.name}</h1><div class="role">${office.role}</div></div>
      </div>
      <div class="hud-bar">
        ${hudBadge(`${idleCount}/${data.team.length}`, "Idle")}
        ${hudBadge(data.pendingApprovals.length, "Aprobaciones")}
        ${hudBadge(data.pendingEscalations.length, "Escalaciones")}
        ${hudBadge(data.frozenConflicts.length, "Conflictos")}
        <button class="hud-badge hud-button" id="open-terminal">🖥️ Ver detalle</button>
      </div>
    </div>

    <div class="terminal">
      <div class="terminal-header"><span>TERMINAL — ${office.name}</span><button class="terminal-close">✕</button></div>
      <section class="panel"><h2>Equipo</h2>${renderAgentGrid(data.team)}</section>
      <section class="panel"><h2>Aprobaciones pendientes</h2>${renderStatList(data.pendingApprovals, "Sin aprobaciones pendientes", (i) => `<li>${describeItem(i)}</li>`)}</section>
      <section class="panel"><h2>Escalaciones esperando al CEO</h2>${renderStatList(data.pendingEscalations, "Sin escalaciones pendientes", (i) => `<li>${describeItem(i)}</li>`)}</section>
      <section class="panel"><h2>Conflictos congelados</h2>${renderStatList(data.frozenConflicts, "Sin conflictos activos", (i) => `<li>${describeItem(i)}</li>`)}</section>
    </div>
  `;

  wireOfficeChrome(container, office);
}

function renderAgentOffice(container, officeId, data) {
  const office = officeFor(officeId);
  const scalarEntries = [];
  const listEntries = [];

  for (const [key, value] of Object.entries(data)) {
    if (["agent", "state", "currentTask", "lastUpdated"].includes(key)) continue;
    if (Array.isArray(value)) listEntries.push([key, value]);
    else scalarEntries.push([key, value]);
  }

  container.innerHTML = `
    <button class="back-btn" id="back">&larr; Volver al pasillo</button>
    <div class="scene-wrap" style="--accent:${office.accent}">
      ${officeScene({ officeId: office.id, accent: office.accent, icon: office.icon })}
      <div class="scene-caption">
        <span class="icon">${office.icon}</span>
        <div><h1>${office.name}</h1><div class="role">${office.role}</div></div>
        ${pillHtml(data.state ?? "unknown")}
      </div>
      <div class="hud-bar">
        ${scalarEntries.map(([k, v]) => hudBadge(v, humanize(k))).join("")}
        <button class="hud-badge hud-button" id="open-terminal">🖥️ Ver detalle</button>
      </div>
    </div>

    <div class="terminal">
      <div class="terminal-header"><span>TERMINAL — ${office.name}</span><button class="terminal-close">✕</button></div>
      ${data.currentTask ? `<section class="panel"><h2>Tarea actual</h2><p>${data.currentTask}</p></section>` : ""}
      ${listEntries
        .map(
          ([key, items]) => `
        <section class="panel">
          <h2>${humanize(key)}</h2>
          ${key === "team" ? renderAgentGrid(items) : renderStatList(items, "Sin ítems", (i) => `<li>${describeItem(i)}</li>`)}
        </section>`
        )
        .join("")}
      <p style="color: var(--text-dim); font-size: 0.75rem;">
        Última actualización: ${data.lastUpdated ? new Date(data.lastUpdated).toLocaleString("es-AR") : "sin datos"}
      </p>
    </div>
  `;

  wireOfficeChrome(container, office);
}

async function renderRoute() {
  const app = document.getElementById("app");
  const hash = location.hash || "#lobby";

  if (hash === "#lobby" || hash === "") {
    app.innerHTML = `<div class="loading">Cargando...</div>`;
    try {
      const overview = await fetchJson("/api/overview");
      renderLobby(app, overview.team);
    } catch (err) {
      app.innerHTML = `<div class="error">No se pudo conectar con el backend (${err.message}). ¿Está corriendo?</div>`;
    }
    return;
  }

  const match = hash.match(/^#office\/(.+)$/);
  if (match) {
    const officeId = match[1];
    app.innerHTML = `<div class="loading">Cargando oficina...</div>`;
    try {
      if (officeId === "ceo") {
        const overview = await fetchJson("/api/overview");
        renderCeoOffice(app, overview);
      } else {
        const status = await fetchJson(`/api/status/${officeId}`);
        renderAgentOffice(app, officeId, status);
      }
    } catch (err) {
      app.innerHTML = `<div class="error">No se pudo cargar la oficina (${err.message}).</div>`;
    }
    return;
  }

  location.hash = "#lobby";
}

window.addEventListener("hashchange", renderRoute);
window.addEventListener("DOMContentLoaded", renderRoute);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}
