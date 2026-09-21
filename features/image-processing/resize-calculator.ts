import { ResizeConfig, PHOTO_PRESETS } from "@/types/config";
import { CropArea } from "@/types/image";

export interface Dimensions {
  width: number;
  height: number;
}

export interface CropRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
}

export interface CalculatedTarget {
  canvasWidth: number;
  canvasHeight: number;
  cropRect: CropRect;
}

export function calculateTargetDimensions(
  origW: number,
  origH: number,
  config: ResizeConfig,
  customCrop?: CropArea
): CalculatedTarget {
  if (origW <= 0 || origH <= 0) {
    return {
      canvasWidth: config.width || 800,
      canvasHeight: config.height || 600,
      cropRect: {
        sx: 0,
        sy: 0,
        sw: origW,
        sh: origH,
        dx: 0,
        dy: 0,
        dw: config.width,
        dh: config.height,
      },
    };
  }

  // If custom drag-and-drop crop coordinates exist, use them
  if (customCrop) {
    const sx = Math.max(0, Math.round(customCrop.x * origW));
    const sy = Math.max(0, Math.round(customCrop.y * origH));
    const sw = Math.max(1, Math.min(origW - sx, Math.round(customCrop.width * origW)));
    const sh = Math.max(1, Math.min(origH - sy, Math.round(customCrop.height * origH)));

    let dw = config.width;
    let dh = config.height;

    if (config.mode === "preset" && config.selectedPresetId) {
      const preset = PHOTO_PRESETS.find((p) => p.id === config.selectedPresetId);
      if (preset) {
        dw = preset.width;
        dh = preset.height;
      }
    }

    return {
      canvasWidth: dw,
      canvasHeight: dh,
      cropRect: {
        sx,
        sy,
        sw,
        sh,
        dx: 0,
        dy: 0,
        dw,
        dh,
      },
    };
  }

  const aspect = origW / origH;
  let targetW = config.width;
  let targetH = config.height;

  switch (config.mode) {
    case "exact":
      targetW = Math.max(1, config.width);
      targetH = Math.max(1, config.height);
      return {
        canvasWidth: targetW,
        canvasHeight: targetH,
        cropRect: {
          sx: 0,
          sy: 0,
          sw: origW,
          sh: origH,
          dx: 0,
          dy: 0,
          dw: targetW,
          dh: targetH,
        },
      };

    case "keep-aspect-width":
      targetW = Math.max(1, config.width);
      targetH = Math.max(1, Math.round(targetW / aspect));
      return {
        canvasWidth: targetW,
        canvasHeight: targetH,
        cropRect: {
          sx: 0,
          sy: 0,
          sw: origW,
          sh: origH,
          dx: 0,
          dy: 0,
          dw: targetW,
          dh: targetH,
        },
      };

    case "keep-aspect-height":
      targetH = Math.max(1, config.height);
      targetW = Math.max(1, Math.round(targetH * aspect));
      return {
        canvasWidth: targetW,
        canvasHeight: targetH,
        cropRect: {
          sx: 0,
          sy: 0,
          sw: origW,
          sh: origH,
          dx: 0,
          dy: 0,
          dw: targetW,
          dh: targetH,
        },
      };

    case "max-dimension": {
      const maxDim = Math.max(1, config.maxDimension);
      if (origW > origH) {
        targetW = maxDim;
        targetH = Math.max(1, Math.round(maxDim / aspect));
      } else {
        targetH = maxDim;
        targetW = Math.max(1, Math.round(maxDim * aspect));
      }
      return {
        canvasWidth: targetW,
        canvasHeight: targetH,
        cropRect: {
          sx: 0,
          sy: 0,
          sw: origW,
          sh: origH,
          dx: 0,
          dy: 0,
          dw: targetW,
          dh: targetH,
        },
      };
    }

    case "fit": {
      const boxW = Math.max(1, config.width);
      const boxH = Math.max(1, config.height);
      const scale = Math.min(boxW / origW, boxH / origH);
      targetW = Math.max(1, Math.round(origW * scale));
      targetH = Math.max(1, Math.round(origH * scale));
      return {
        canvasWidth: targetW,
        canvasHeight: targetH,
        cropRect: {
          sx: 0,
          sy: 0,
          sw: origW,
          sh: origH,
          dx: 0,
          dy: 0,
          dw: targetW,
          dh: targetH,
        },
      };
    }

    case "preset": {
      const preset = PHOTO_PRESETS.find((p) => p.id === config.selectedPresetId) || PHOTO_PRESETS[0];
      const boxW = preset.width;
      const boxH = preset.height;
      const targetRatio = preset.aspectRatio;

      let sx = 0;
      let sy = 0;
      let sw = origW;
      let sh = origH;

      if (aspect > targetRatio) {
        sw = Math.round(origH * targetRatio);
        sx = Math.round((origW - sw) / 2);
      } else {
        sh = Math.round(origW / targetRatio);
        sy = Math.round((origH - sh) / 2);
      }

      return {
        canvasWidth: boxW,
        canvasHeight: boxH,
        cropRect: {
          sx,
          sy,
          sw,
          sh,
          dx: 0,
          dy: 0,
          dw: boxW,
          dh: boxH,
        },
      };
    }

    case "fill-crop": {
      const boxW = Math.max(1, config.width);
      const boxH = Math.max(1, config.height);
      const targetRatio = boxW / boxH;

      let sx = 0;
      let sy = 0;
      let sw = origW;
      let sh = origH;

      if (aspect > targetRatio) {
        // Image is wider than target box -> crop left/right
        sw = Math.round(origH * targetRatio);
        sx = Math.round((origW - sw) / 2);
      } else {
        // Image is taller than target box -> crop top/bottom
        sh = Math.round(origW / targetRatio);
        sy = Math.round((origH - sh) / 2);
      }

      return {
        canvasWidth: boxW,
        canvasHeight: boxH,
        cropRect: {
          sx,
          sy,
          sw,
          sh,
          dx: 0,
          dy: 0,
          dw: boxW,
          dh: boxH,
        },
      };
    }

    default:
      return {
        canvasWidth: origW,
        canvasHeight: origH,
        cropRect: {
          sx: 0,
          sy: 0,
          sw: origW,
          sh: origH,
          dx: 0,
          dy: 0,
          dw: origW,
          dh: origH,
        },
      };
  }
}
