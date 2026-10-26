import { execFile } from "node:child_process";
import path from "node:path";

/**
 * Convierte un .docx a .pdf usando LibreOffice en modo headless.
 * REQUIERE LibreOffice instalado en el sistema (apt install libreoffice en
 * producción — ver DEVLOG.md). Si falla, no rompe el flujo: devuelve
 * { success: false } y el .docx queda disponible igual.
 * Usa execFile (no exec) con argumentos como array — nunca pasa por un
 * shell, así que docxPath/outputDir no pueden inyectar comandos aunque
 * contengan caracteres especiales.
 * @param {string} docxPath
 * @param {string} outputDir
 * @returns {Promise<{ success: boolean, pdfPath?: string, error?: string }>}
 */
export function convertDocxToPdf(docxPath, outputDir) {
  return new Promise((resolve) => {
    execFile(
      "soffice",
      ["--headless", "--convert-to", "pdf", "--outdir", outputDir, docxPath],
      { timeout: 60000 },
      (error) => {
        if (error) {
          resolve({ success: false, error: error.message });
          return;
        }
        const pdfPath = path.join(outputDir, path.basename(docxPath, ".docx") + ".pdf");
        resolve({ success: true, pdfPath });
      }
    );
  });
}
