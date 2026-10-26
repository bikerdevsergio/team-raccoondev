// Levanta los 3 procesos necesarios: el servidor de Miniverse (heartbeats +
// acciones), nuestro servidor Express (frontend + chat), y el puente que
// traduce shared/status/*.json a heartbeats reales.
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../");

const procs = [
  { name: "miniverse", cmd: "npx", args: ["miniverse", "--port", "4321", "--no-browser"] },
  { name: "server", cmd: "node", args: ["src/server.js"] },
  { name: "bridge", cmd: "node", args: ["scripts/bridge.mjs"] },
];

const children = procs.map(({ name, cmd, args }) => {
  const child = spawn(cmd, args, { cwd: APP_ROOT, env: process.env });
  child.stdout.on("data", (d) => process.stdout.write(`[${name}] ${d}`));
  child.stderr.on("data", (d) => process.stderr.write(`[${name}] ${d}`));
  return child;
});

function shutdown() {
  for (const child of children) child.kill();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
