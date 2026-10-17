import { File } from "node:buffer";

// cheerio -> undici requiere el global File, que Node 18 no expone por
// defecto (sí existe en node:buffer desde la v18.13). Debe importarse
// ANTES de "cheerio" en cualquier archivo que lo use.
if (typeof globalThis.File === "undefined") {
  globalThis.File = File;
}
