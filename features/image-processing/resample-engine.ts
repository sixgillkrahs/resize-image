import { CropRect } from "./resize-calculator";

/**
 * Perform high-quality multi-step (step-down) canvas resampling.
 * Prevents blur and pixel-skipping aliasing when downscaling large images.
 */
export function drawImageHighQuality(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  bitmap: ImageBitmap | HTMLImageElement | HTMLCanvasElement | OffscreenCanvas,
  cropRect: CropRect,
  canvasWidth: number,
  canvasHeight: number
): void {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const { sx, sy, sw, sh, dx, dy, dw, dh } = cropRect;

  // If downscaling ratio is small (< 2x), single pass draw is fine
  if (sw <= dw * 2 && sh <= dh * 2) {
    ctx.drawImage(bitmap, sx, sy, sw, sh, dx, dy, dw, dh);
    return;
  }

  // Multi-step progressive downscaling for > 2x reduction
  let curW = sw;
  let curH = sh;

  // Create temporary canvas for step 1
  let curCanvas: OffscreenCanvas | HTMLCanvasElement;
  let curCtx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

  if (typeof OffscreenCanvas !== "undefined") {
    curCanvas = new OffscreenCanvas(sw, sh);
    curCtx = curCanvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
  } else {
    curCanvas = document.createElement("canvas");
    curCanvas.width = sw;
    curCanvas.height = sh;
    curCtx = curCanvas.getContext("2d") as CanvasRenderingContext2D;
  }

  if (!curCtx) {
    ctx.drawImage(bitmap, sx, sy, sw, sh, dx, dy, dw, dh);
    return;
  }

  curCtx.imageSmoothingEnabled = true;
  curCtx.imageSmoothingQuality = "high";

  // Draw initial cropped cropArea to temp canvas
  curCtx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, sw, sh);

  // Halve dimensions progressively until target size is reached
  while (curW > dw * 2 || curH > dh * 2) {
    const nextW = Math.max(dw, Math.floor(curW * 0.5));
    const nextH = Math.max(dh, Math.floor(curH * 0.5));

    let nextCanvas: OffscreenCanvas | HTMLCanvasElement;
    let nextCtx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

    if (typeof OffscreenCanvas !== "undefined") {
      nextCanvas = new OffscreenCanvas(nextW, nextH);
      nextCtx = nextCanvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
    } else {
      nextCanvas = document.createElement("canvas");
      nextCanvas.width = nextW;
      nextCanvas.height = nextH;
      nextCtx = nextCanvas.getContext("2d") as CanvasRenderingContext2D;
    }

    if (!nextCtx) break;

    nextCtx.imageSmoothingEnabled = true;
    nextCtx.imageSmoothingQuality = "high";
    nextCtx.drawImage(curCanvas, 0, 0, curW, curH, 0, 0, nextW, nextH);

    // Free previous temp canvas memory
    curCanvas.width = 0;
    curCanvas.height = 0;

    curCanvas = nextCanvas;
    curCtx = nextCtx;
    curW = nextW;
    curH = nextH;
  }

  // Final draw to target destination canvas
  ctx.drawImage(curCanvas, 0, 0, curW, curH, dx, dy, dw, dh);

  // Cleanup final temp canvas
  curCanvas.width = 0;
  curCanvas.height = 0;
}
