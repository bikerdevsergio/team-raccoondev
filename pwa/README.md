# PWA RaccoonDev HQ — Fase 1

Lobby + 6 oficinas (CEO, Dante, Midas, Volt, Themis, Hermes), leyendo en vivo el estado real de `shared/`.

## Cómo correrla

```bash
cd pwa/backend
npm install   # primera vez
npm start     # sirve la API + el frontend en http://localhost:4100
```

Abrí `http://localhost:4100` en el navegador (o instalala como PWA — tiene manifest + service worker).

## Qué incluye esta fase
- Backend Express de **solo lectura** sobre `shared/status/*.json`, `shared/escalations.json`, `shared/approval_queue.json`, `shared/conflicts.json`.
- Frontend vanilla HTML/CSS/JS (sin framework), estética cyberpunk/dark.
- Lobby con 6 puertas (incluida la del CEO, al mismo nivel que los agentes).
- Cada oficina de agente renderiza genéricamente lo que ese agente ya expone en su `sync_status()` — no hace falta tocar el frontend cuando un agente agrega un campo nuevo a su status.
- La oficina del CEO usa `/api/overview`: vista agregada de todo el equipo + aprobaciones/escalaciones/conflictos pendientes.

## Fuera de esta fase (pendiente)
- Personalización de motos con RaccoonCoins.
- Sala de Reuniones (integración Google Meet) — definida desde el inicio como el último módulo.
- Escritura desde la PWA hacia `shared/` (hoy es 100% solo lectura).
