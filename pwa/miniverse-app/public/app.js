import { Miniverse } from "/vendor/miniverse-core/index.js";

const MINIVERSE_SERVER = "http://localhost:4321";

const OFFICES = [
  { id: "dante", name: "Dante", role: "Gerente General", accent: "#ff3fa0" },
  { id: "midas", name: "Midas", role: "Lead de Finanzas", accent: "#f3d978" },
  { id: "volt", name: "Volt", role: "CTO", accent: "#39e6ff" },
  { id: "themis", name: "Themis", role: "Lead Legal", accent: "#b388ff" },
  { id: "hermes", name: "Hermes", role: "Lead de Marketing", accent: "#ff7a59" },
];

function walkSpriteConfig(id) {
  return {
    frameWidth: 64,
    frameHeight: 64,
    sheets: { base: `/sprites/${id}_walk.png` },
    animations: {
      idle_down: { sheet: "base", row: 0, frames: 2, speed: 0.5 },
      idle_up: { sheet: "base", row: 1, frames: 2, speed: 0.5 },
      walk_down: { sheet: "base", row: 0, frames: 4, speed: 0.15 },
      walk_up: { sheet: "base", row: 1, frames: 4, speed: 0.15 },
      walk_left: { sheet: "base", row: 2, frames: 4, speed: 0.15 },
      walk_right: { sheet: "base", row: 3, frames: 4, speed: 0.15 },
      working: { sheet: "base", row: 0, frames: 2, speed: 0.3 },
      sleeping: { sheet: "base", row: 0, frames: 2, speed: 0.8 },
      talking: { sheet: "base", row: 0, frames: 4, speed: 0.12 },
    },
  };
}

const COLS = 12;
const ROWS = 11;
const TILE = 32;
const DESK_ROW = 2;
const WALL_ROW = 0;
const CURB_ROW = 5;
const PARKING_ROWS = [6, 7, 8, 9, 10];
const MOTO_ROW = 8;
const DESK_COLS = [1, 3, 5, 7, 9];
const CEO_MOTO_COL = 11;

const locations = {
  ceo_desk: { x: 5, y: 4, label: "Tu oficina" },
};
OFFICES.forEach((o, i) => {
  locations[`${o.id}_desk`] = { x: DESK_COLS[i], y: DESK_ROW, label: o.name };
});

const layer = Array.from({ length: ROWS }, (_, y) => {
  if (y === WALL_ROW) return Array.from({ length: COLS }, () => "wall");
  if (y === CURB_ROW) return Array.from({ length: COLS }, () => "curb");
  if (PARKING_ROWS.includes(y)) {
    return Array.from({ length: COLS }, (_, x) => {
      if (y === MOTO_ROW) {
        if (x === CEO_MOTO_COL) return "moto_ceo";
        const idx = DESK_COLS.indexOf(x);
        if (idx !== -1) return `moto_${OFFICES[idx].id}`;
      }
      return "pavement";
    });
  }
  return Array.from({ length: COLS }, () => "floor");
});

const walkable = Array.from({ length: ROWS }, (_, y) =>
  Array.from({ length: COLS }, () => y !== WALL_ROW)
);

const sceneConfig = {
  name: "raccoondev-hq",
  tileWidth: TILE,
  tileHeight: TILE,
  layers: [layer],
  walkable,
  locations,
  tiles: {
    floor: "/tiles/floor.png",
    wall: "/tiles/wall.png",
    curb: "/tiles/curb.png",
    pavement: "/tiles/pavement.png",
    ...Object.fromEntries(OFFICES.map((o) => [`moto_${o.id}`, `/tiles/moto_${o.id}.png`])),
    moto_ceo: "/tiles/moto_ceo.png",
  },
};

const spriteSheets = Object.fromEntries(OFFICES.map((o) => [o.id, walkSpriteConfig(o.id)]));
const citizens = OFFICES.map((o) => ({
  agentId: o.id,
  name: o.name,
  sprite: o.id,
  position: `${o.id}_desk`,
}));

const mv = new Miniverse({
  container: document.getElementById("world"),
  world: "raccoondev-hq",
  scene: "main",
  scale: 2,
  width: COLS * TILE,
  height: ROWS * TILE,
  sceneConfig,
  spriteSheets,
  citizens,
  autoSpawn: false,
  signal: { type: "rest", url: `${MINIVERSE_SERVER}/api/agents`, interval: 2000 },
});

await mv.start();

// ---- Roster chips ----
const roster = document.getElementById("roster");
for (const o of OFFICES) {
  const chip = document.createElement("button");
  chip.className = "chip";
  chip.innerHTML = `<span class="dot" style="background:${o.accent}"></span>${o.name}`;
  chip.addEventListener("click", () => openPanel(o.id));
  roster.appendChild(chip);
}

mv.on("citizen:click", (data) => {
  const id = data?.agentId ?? data?.citizen?.agentId;
  if (id) openPanel(id);
});

// ---- Panel / chat ----
const panel = document.getElementById("panel");
const panelName = document.getElementById("panel-name");
const panelRole = document.getElementById("panel-role");
const callBtn = document.getElementById("call-btn");
const chatLog = document.getElementById("chat-log");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const fileInput = document.getElementById("file-input");
const attachBtn = document.getElementById("attach-btn");
const attachmentsBar = document.getElementById("attachments");

let currentOfficeId = null;
let pendingFiles = [];

function officeFor(id) {
  return OFFICES.find((o) => o.id === id);
}

async function openPanel(id) {
  currentOfficeId = id;
  const office = officeFor(id);
  panelName.textContent = office.name;
  panelRole.textContent = office.role;
  panel.classList.add("open");
  callBtn.disabled = false;
  await loadHistory(id);
}

document.getElementById("panel-close").addEventListener("click", () => {
  panel.classList.remove("open");
  currentOfficeId = null;
});

callBtn.addEventListener("click", async () => {
  if (!currentOfficeId) return;
  callBtn.disabled = true;
  callBtn.textContent = "Viniendo...";
  await fetch(`${MINIVERSE_SERVER}/api/act`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agent: currentOfficeId, action: { type: "move", to: "ceo_desk" } }),
  }).catch(() => {});
  setTimeout(() => {
    callBtn.textContent = "📣 Llamar a mi oficina";
  }, 2500);
});

function addMessage(role, text, files = []) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.textContent = text;
  for (const f of files) {
    const chip = document.createElement("span");
    chip.className = "file-chip";
    chip.textContent = `📎 ${f.name}`;
    div.appendChild(document.createElement("br"));
    div.appendChild(chip);
  }
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
  return div;
}

async function loadHistory(id) {
  chatLog.innerHTML = "";
  try {
    const res = await fetch(`/api/chat/${id}/history`);
    const data = await res.json();
    for (const m of data.messages ?? []) {
      addMessage(m.role === "user" ? "user" : "agent", m.text, m.files ?? []);
    }
  } catch {
    // sin historial todavía, arranca vacío
  }
}

attachBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => {
  pendingFiles = Array.from(fileInput.files ?? []);
  attachmentsBar.innerHTML = "";
  for (const f of pendingFiles) {
    const chip = document.createElement("span");
    chip.className = "att";
    chip.textContent = `📎 ${f.name}`;
    attachmentsBar.appendChild(chip);
  }
});

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentOfficeId) return;
  const text = chatInput.value.trim();
  if (!text && pendingFiles.length === 0) return;

  const filesMeta = pendingFiles.map((f) => ({ name: f.name, type: f.type }));
  addMessage("user", text, filesMeta);
  chatInput.value = "";
  attachmentsBar.innerHTML = "";

  const attachments = await Promise.all(
    pendingFiles.map(async (f) => ({
      name: f.name,
      mimeType: f.type || "application/octet-stream",
      dataBase64: await fileToBase64(f),
    }))
  );
  pendingFiles = [];
  fileInput.value = "";

  const loadingEl = addMessage("agent", "…pensando…");
  loadingEl.classList.add("loading-chat");

  try {
    const res = await fetch(`/api/chat/${currentOfficeId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, attachments }),
    });
    const data = await res.json();
    loadingEl.remove();
    if (data.error) {
      addMessage("agent", `⚠️ ${data.error}`);
    } else {
      addMessage("agent", data.reply);
    }
  } catch (err) {
    loadingEl.remove();
    addMessage("agent", `⚠️ No se pudo conectar: ${err.message}`);
  }
});
