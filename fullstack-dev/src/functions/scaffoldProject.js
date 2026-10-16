import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createTask } from "./createTask.js";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../");
const PROJECTS_DIR = path.join(PROJECT_ROOT, "shared", "dev", "projects");

/**
 * Genera la estructura base de un proyecto nuevo (carpetas, package.json,
 * README) y registra la tarea de scaffolding en fase "requisitos" vía
 * create_task — todo proyecto nuevo respeta el ciclo desde el día 1.
 * @param {{ name: string, description: string, basePath?: string }} spec
 * @returns {Promise<object>} { projectPath, task }
 */
export async function scaffoldProject(spec) {
  if (!spec || !spec.name || !spec.description) {
    throw new Error("scaffold_project: 'spec.name' y 'spec.description' son obligatorios");
  }

  const projectPath = spec.basePath ?? path.join(PROJECTS_DIR, spec.name);

  await mkdir(path.join(projectPath, "src"), { recursive: true });

  const packageJson = {
    name: spec.name,
    version: "0.1.0",
    description: spec.description,
    type: "module",
    main: "src/index.js",
  };
  await writeFile(path.join(projectPath, "package.json"), JSON.stringify(packageJson, null, 2), "utf-8");
  await writeFile(path.join(projectPath, "README.md"), `# ${spec.name}\n\n${spec.description}\n`, "utf-8");

  const { task, created } = await createTask({
    description: `Scaffolding inicial: ${spec.description}`,
    project: spec.name,
  });

  return { projectPath, task: created ? task : null };
}
