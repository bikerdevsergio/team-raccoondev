# PWA RaccoonDev HQ — motor Miniverse

Mundo pixel art top-down (estilo Stardew Valley/RPG 16-bit) construido sobre **[Miniverse](https://github.com/ianscott313/miniverse)** (MIT, open source): los 5 agentes son mapaches animados parados en su escritorio, reflejando su estado real (`shared/status/*.json`), y se puede "llamar" a cualquiera a tu oficina y charlar con él por chat (con adjuntos de imagen/PDF/código).

Reemplaza los dos intentos anteriores (dashboard de tarjetas, después escenas SVG estáticas por oficina) — descartados porque no se sentían como un juego real.

## Cómo correrla

```bash
cd pwa/miniverse-app
npm install                 # primera vez
cp .env.example .env        # completá ANTHROPIC_API_KEY (misma que los agentes)
npm run sprites             # genera los sprites de los mapaches y el tile de piso (ya generados, solo hace falta si se borran)
npm start                   # levanta los 3 procesos: servidor Miniverse (:4321), backend+frontend (:4200), puente de estado
```

Abrí `http://localhost:4200`.

## Arquitectura

- **`@miniverse/server`** (puerto 4321) — ingesta de heartbeats/acciones del motor Miniverse (sin tocar).
- **`@miniverse/core`** — motor de renderizado (canvas, sprites, pathfinding) servido como vendor estático desde `node_modules`.
- **`src/server.js`** (puerto 4200) — sirve el frontend + la API de chat (`/api/chat/:officeId`).
- **`scripts/bridge.mjs`** — lee `shared/status/*.json` cada 5s y manda heartbeats reales al servidor Miniverse (idle/busy/blocked → idle/working/error). No inventa estado: si un agente no tiene status.json, no aparece.
- **`scripts/generate-sprites.mjs`** / **`generate-tiles.mjs`** — generan los sprites de mapache (256×256, 4×4 frames) y el tile de piso **por código, sin IA de imágenes** (no hay credencial de ningún servicio de generación configurada).
- **`src/chat.js`** — chat por agente vía Claude API (`claude-sonnet-4-6`), con persona propia por rol. Historial persistido en `shared/chat/<agente>.json`. Soporta adjuntos de imagen, PDF y archivos de texto/código (inline).

## Interacción

1. Clic en un mapache (o en su chip abajo) → abre el panel.
2. **"Llamar a mi oficina"** → el mapache camina hasta la ubicación `ceo_desk` (acción `move` de Miniverse).
3. Chat de texto con adjuntos (📎) — imágenes, PDF, `.txt`/código se mandan como parte del mensaje a Claude.

## Pendiente / próximos pasos

- Arte de sprites y tiles es un primer pase procedural (no arte generado por IA) — se puede refinar más adelante.
- El chat no hace streaming (espera la respuesta completa).
- Sala de Reuniones (Google Meet) sigue siendo el último módulo, sin construir.
