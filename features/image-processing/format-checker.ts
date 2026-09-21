export interface BrowserCapabilities {
  hasWebWorker: boolean;
  hasOffscreenCanvas: boolean;
  hasCreateImageBitmap: boolean;
  hasWebpExport: boolean;
  hasAvifExport: boolean;
}

let cachedCapabilities: BrowserCapabilities | null = null;

export async function detectBrowserCapabilities(): Promise<BrowserCapabilities> {
  if (cachedCapabilities) return cachedCapabilities;

  const hasWebWorker = typeof Worker !== "undefined";
  const hasOffscreenCanvas = typeof OffscreenCanvas !== "undefined";
  const hasCreateImageBitmap = typeof createImageBitmap !== "undefined";

  let hasWebpExport = false;
  let hasAvifExport = false;

  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;

    try {
      const webpUrl = canvas.toDataURL("image/webp");
      hasWebpExport = webpUrl.startsWith("data:image/webp");
    } catch {
      hasWebpExport = false;
    }

    if (hasOffscreenCanvas) {
      try {
        const offCanvas = new OffscreenCanvas(1, 1);
        const avifBlob = await offCanvas.convertToBlob({ type: "image/avif" });
        hasAvifExport = avifBlob.type === "image/avif";
      } catch {
        hasAvifExport = false;
      }
    }
  }

  cachedCapabilities = {
    hasWebWorker,
    hasOffscreenCanvas,
    hasCreateImageBitmap,
    hasWebpExport,
    hasAvifExport,
  };

  return cachedCapabilities;
}
