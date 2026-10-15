// MODO 2 — En vivo (PLACEHOLDER, NO IMPLEMENTADO).
// Se construye cuando llegue la Sala de Reuniones (último módulo de la PWA,
// con integración Google Meet). Dejado listo para conectar sin rediseñar:
//
// Arquitectura prevista:
// 1. La PWA (Sala de Reuniones) abre un WebSocket hacia este módulo y envía
//    chunks de transcripción en tiempo real a medida que la reunión avanza.
// 2. Cada chunk se procesa con Claude API en modo streaming
//    (client.messages.stream(...), NO .parse() — queremos tokens parciales,
//    no hay que esperar a que termine la reunión).
// 3. Las apreciaciones/preguntas que vayan saliendo se envían de vuelta a la
//    PWA en tiempo real (vía el mismo WebSocket o la cola de notificaciones
//    de ../lib/notifications.js).
// 4. Al cerrar la sesión, se corre meetingNotes() (Modo 1) sobre la
//    transcripción completa acumulada para dejar el registro final en
//    shared/meeting_notes/<id>.json — Modo 2 es "en caliente", Modo 1 es
//    la versión definitiva que queda guardada.
//
// Dependencias que faltan decidir antes de codear esto (no asumir nada):
// - Librería de WebSocket server (ej. 'ws') — no instalada todavía.
// - Cómo se autentica la conexión PWA -> este módulo.
// - Formato exacto del chunk (¿texto plano? ¿con speaker id?).
//
// import { getAnthropicClient } from "../lib/anthropicClient.js";
// import { pushNotification } from "../lib/notifications.js";
//
// export function startLiveMeetingSession(sessionId) {
//   throw new Error("meeting_notes (Modo 2): no implementado todavía — ver comentarios de arquitectura arriba");
// }
//
// export function pushTranscriptChunk(sessionId, chunk) {
//   throw new Error("meeting_notes (Modo 2): no implementado todavía");
// }
//
// export function endLiveMeetingSession(sessionId) {
//   throw new Error("meeting_notes (Modo 2): no implementado todavía");
// }
