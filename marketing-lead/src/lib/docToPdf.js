import { exec } from "node:child_process";
import path from "node:path";

/**
 * Convierte un .docx a .pdf usando LibreOffice en modo headless.
 * REQUIERE LibreOffice instalado en el sistema (apt install libreoffice en
 * producción — ver DEVLOG.md). Si falla, no rompe el flujo: devuelve
 * { success: false } y el .docx queda disponible igual.
 * @param {string} docxPath
 * @param {string} outputDir
 * @returns {Promise<{ success: boolean, pdfPath?: string, error?: string }>}
 */
export function convertDocxToPdf(docxPath, outputDir) {
  return new Promise((resolve) => {
    const command = `soffice --headless --convert-to pdf --outdir "${outputDir}" "${docxPath}"`;
    exec(command, { timeout: 60000 }, (error) => {
      if (error) {
        resolve({ success: false, error: error.message });
        return;
      }
      const pdfPath = path.join(outputDir, path.basename(docxPath, ".docx") + ".pdf");
      resolve({ success: true, pdfPath });
    });
  });
}
