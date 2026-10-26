// Generador de escenas SVG tipo videojuego: puertas de pasillo (lobby) y
// habitaciones de oficina (vista de agente/CEO). Todo paramétrico por color
// de acento + ícono de rol, para no tener que dibujar 6 ilustraciones a mano.

function esc(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const STATE_COLOR = {
  idle: "#3de893",
  busy: "#ffcc4d",
  blocked: "#ff5470",
  ok: "#3de893",
  unknown: "#5a6080",
};

/** Puerta de pasillo para el lobby, con moto estacionada al lado. */
export function doorScene({ name, icon, state }) {
  const light = STATE_COLOR[state] ?? STATE_COLOR.unknown;
  const blink = state === "busy" ? "door-light-blink" : "";

  return `
  <svg viewBox="0 0 170 230" class="door-svg" aria-hidden="true">
    <defs>
      <linearGradient id="doorGrad-${name}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#23263a"/>
        <stop offset="100%" stop-color="#171925"/>
      </linearGradient>
    </defs>

    <!-- piso -->
    <rect x="0" y="195" width="170" height="35" fill="#0d0e17"/>
    <rect x="0" y="195" width="170" height="4" fill="#2a2d42"/>

    <!-- moto estacionada -->
    <g transform="translate(8,188)" opacity="0.9">
      <ellipse cx="18" cy="24" rx="10" ry="4" fill="#000" opacity="0.35"/>
      <circle cx="6" cy="22" r="7" fill="#101320" stroke="#444a66" stroke-width="2"/>
      <circle cx="30" cy="22" r="7" fill="#101320" stroke="#444a66" stroke-width="2"/>
      <path d="M6 22 L16 10 L26 10 L30 22" fill="none" stroke="${light}" stroke-width="2.5" stroke-linecap="round"/>
      <rect x="13" y="6" width="10" height="4" rx="1.5" fill="${light}"/>
    </g>

    <!-- marco puerta -->
    <rect x="45" y="10" width="110" height="190" rx="4" fill="url(#doorGrad-${name})" stroke="#363a52" stroke-width="3"/>
    <rect x="53" y="18" width="94" height="174" rx="2" fill="#1c1f30" stroke="#2d3049" stroke-width="2"/>

    <!-- ventanilla con el icono -->
    <rect x="70" y="32" width="60" height="50" rx="6" fill="#11131d" stroke="${light}" stroke-width="2"/>
    <text x="100" y="66" font-size="30" text-anchor="middle">${icon}</text>

    <!-- luz de estado -->
    <circle class="${blink}" cx="100" cy="20" r="5" fill="${light}" style="filter:drop-shadow(0 0 6px ${light})"/>

    <!-- picaporte -->
    <circle cx="137" cy="112" r="4" fill="#565b7d"/>

    <!-- placa con el nombre -->
    <rect x="65" y="150" width="70" height="26" rx="3" fill="#0d0e17" stroke="${light}" stroke-width="1.5"/>
    <text x="100" y="167" font-size="12" font-family="'Orbitron', sans-serif" font-weight="700" fill="#dfe6f3" text-anchor="middle" letter-spacing="1">${esc(name).toUpperCase()}</text>
  </svg>`;
}

const ROLE_PROPS = {
  ceo: (accent) => `
    <g transform="translate(360,70)">
      <rect x="-22" y="-10" width="44" height="54" rx="3" fill="#2a2d42" stroke="${accent}" stroke-width="2"/>
      <text x="0" y="22" font-size="26" text-anchor="middle">🏆</text>
    </g>`,
  "gg-raccoon": (accent) => `
    <g transform="translate(360,70)">
      <rect x="-22" y="-10" width="44" height="54" rx="3" fill="#2a2d42" stroke="${accent}" stroke-width="2"/>
      <text x="0" y="22" font-size="26" text-anchor="middle">🗂️</text>
    </g>`,
  "finance-lead": (accent) => `
    <g transform="translate(360,80)">
      <ellipse cx="0" cy="34" rx="22" ry="6" fill="#000" opacity="0.3"/>
      <circle cx="0" cy="26" r="13" fill="#caa23a" stroke="${accent}" stroke-width="2"/>
      <circle cx="0" cy="14" r="13" fill="#e4c158" stroke="${accent}" stroke-width="2"/>
      <circle cx="0" cy="2" r="13" fill="#f3d978" stroke="${accent}" stroke-width="2"/>
    </g>`,
  "fullstack-dev": (accent) => `
    <g transform="translate(355,55)">
      <rect x="-20" y="0" width="40" height="55" rx="2" fill="#1b1d2c" stroke="${accent}" stroke-width="2"/>
      <rect x="-15" y="6" width="30" height="6" fill="${accent}" opacity="0.7"/>
      <rect x="-15" y="16" width="20" height="6" fill="${accent}" opacity="0.5"/>
      <rect x="-15" y="26" width="24" height="6" fill="${accent}" opacity="0.7"/>
      <rect x="-15" y="36" width="16" height="6" fill="${accent}" opacity="0.5"/>
    </g>`,
  "legal-lead": (accent) => `
    <g transform="translate(360,65)">
      <rect x="-3" y="0" width="6" height="40" fill="#555a78"/>
      <path d="M-28 10 L0 0 L28 10" fill="none" stroke="${accent}" stroke-width="2.5"/>
      <line x1="-28" y1="10" x2="-28" y2="10" stroke="${accent}"/>
      <path d="M-28 10 L-36 24 L-20 24 Z" fill="none" stroke="${accent}" stroke-width="2"/>
      <path d="M28 10 L20 24 L36 24 Z" fill="none" stroke="${accent}" stroke-width="2"/>
      <rect x="-14" y="38" width="28" height="6" fill="#555a78"/>
    </g>`,
  "marketing-lead": (accent) => `
    <g transform="translate(360,75)">
      <text x="0" y="10" font-size="30" text-anchor="middle">📣</text>
    </g>`,
};

/** Habitación de oficina: pared, ventana con skyline, escritorio, monitor, personaje. */
export function officeScene({ officeId, accent, icon }) {
  const prop = (ROLE_PROPS[officeId] ?? ROLE_PROPS["gg-raccoon"])(accent);

  return `
  <svg viewBox="0 0 480 260" class="office-svg" aria-hidden="true">
    <defs>
      <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
      </radialGradient>
    </defs>

    <!-- pared -->
    <rect x="0" y="0" width="480" height="180" fill="#141726"/>
    ${Array.from({ length: 8 }, (_, i) => `<line x1="${i * 60}" y1="0" x2="${i * 60}" y2="180" stroke="#1d2033" stroke-width="1"/>`).join("")}

    <!-- ventana con skyline -->
    <rect x="300" y="24" width="150" height="110" fill="#0a0c16" stroke="#3a3f5c" stroke-width="4"/>
    <circle cx="420" cy="55" r="18" fill="url(#moonGlow)"/>
    <circle cx="420" cy="55" r="7" fill="${accent}"/>
    <g fill="#1b1e30">
      <rect x="310" y="90" width="18" height="40"/>
      <rect x="332" y="70" width="16" height="60"/>
      <rect x="352" y="100" width="20" height="30"/>
      <rect x="376" y="80" width="14" height="50"/>
      <rect x="394" y="95" width="18" height="35"/>
      <rect x="416" y="75" width="16" height="55"/>
    </g>
    <g stroke="${accent}" stroke-width="1" opacity="0.6">
      <line x1="332" y1="78" x2="340" y2="78"/>
      <line x1="378" y1="88" x2="384" y2="88"/>
      <line x1="418" y1="85" x2="424" y2="85"/>
    </g>

    <!-- piso -->
    <rect x="0" y="180" width="480" height="80" fill="#1a1c2b"/>
    <rect x="0" y="180" width="480" height="4" fill="${accent}" opacity="0.5"/>
    <g stroke="#242742" stroke-width="2">
      <line x1="0" y1="210" x2="480" y2="210"/>
      <line x1="0" y1="235" x2="480" y2="235"/>
    </g>

    <!-- cuadro de rol en la pared -->
    ${prop}

    <!-- escritorio -->
    <rect x="130" y="188" width="220" height="12" rx="2" fill="#3a3220"/>
    <rect x="140" y="200" width="10" height="34" fill="#2a2516"/>
    <rect x="330" y="200" width="10" height="34" fill="#2a2516"/>

    <!-- monitor -->
    <rect x="195" y="148" width="100" height="58" rx="4" fill="#0d0e17" stroke="#3a3f5c" stroke-width="3"/>
    <rect class="monitor-screen" x="201" y="154" width="88" height="46" fill="${accent}" opacity="0.28"/>
    <rect x="207" y="160" width="40" height="5" fill="${accent}" opacity="0.8"/>
    <rect x="207" y="170" width="60" height="5" fill="${accent}" opacity="0.6"/>
    <rect x="207" y="180" width="30" height="5" fill="${accent}" opacity="0.8"/>
    <rect x="236" y="206" width="12" height="10" fill="#242742"/>
    <rect x="222" y="216" width="40" height="5" fill="#242742"/>

    <!-- personaje (raccoon) -->
    <g class="character-bob" transform="translate(245,178)">
      <ellipse cx="0" cy="36" rx="30" ry="7" fill="#000" opacity="0.25"/>
      <path d="M-20 36 Q-22 10 0 6 Q22 10 20 36 Z" fill="#2b2e42"/>
      <circle cx="0" cy="-6" r="19" fill="#3a3d58"/>
      <path d="M-18 -16 L-10 -30 L-2 -16 Z" fill="#3a3d58"/>
      <path d="M18 -16 L10 -30 L2 -16 Z" fill="#3a3d58"/>
      <path d="M-15 -14 L-9 -24 L-3 -15 Z" fill="#20222f"/>
      <path d="M15 -14 L9 -24 L3 -15 Z" fill="#20222f"/>
      <rect x="-19" y="-11" width="38" height="9" rx="4" fill="#15161f"/>
      <circle cx="-8" cy="-6" r="2.4" fill="${accent}"/>
      <circle cx="8" cy="-6" r="2.4" fill="${accent}"/>
      <path d="M-6 2 Q0 6 6 2" fill="none" stroke="#15161f" stroke-width="1.6" stroke-linecap="round"/>
      <rect x="-21" y="2" width="42" height="7" fill="${accent}"/>
    </g>
  </svg>`;
}
