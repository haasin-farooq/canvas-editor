import type Konva from "konva";

/**
 * Exports the Konva Stage content as a PNG file and triggers a browser download.
 *
 * - Temporarily hides the Transformer so resize/rotate handles don't appear in the export.
 * - Generates a data URL from the stage and triggers a download with filename "ad-export.png".
 * - Restores Transformer visibility after export.
 */
export function exportPng(stage: Konva.Stage): void {
  // Find all Transformer nodes on the stage and hide them
  const transformers = stage.find("Transformer");
  const previousVisibility: boolean[] = transformers.map((t) => t.visible());

  try {
    transformers.forEach((t) => t.visible(false));
    stage.batchDraw();

    const dataUrl = stage.toDataURL({ mimeType: "image/png" });

    const link = document.createElement("a");
    link.download = "ad-export.png";
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Failed to export PNG:", error);
  } finally {
    // Restore Transformer visibility
    transformers.forEach((t, i) => t.visible(previousVisibility[i]));
    stage.batchDraw();
  }
}
