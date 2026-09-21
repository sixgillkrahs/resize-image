/// <reference lib="webworker" />

import { ResizeConfig } from "../../types/config";
import { ImageProcessingResult } from "../../types/image";
import { WorkerRequest, WorkerResponse } from "../../types/worker";
import { calculateTargetDimensions } from "../image-processing/resize-calculator";
import { generateOutputFilename, getImageExtension } from "../../utils/file-helpers";

import { drawImageHighQuality } from "../image-processing/resample-engine";

/* eslint-disable no-restricted-globals */
const ctx: Worker = self as unknown as Worker;

ctx.addEventListener("message", async (event: MessageEvent<WorkerRequest>) => {
  const data = event.data;

  if (!data || data.type !== "PROCESS_IMAGE") return;

  const { taskId, file, config, customCrop } = data;
  const startTime = performance.now();

  try {
    // 1. Decode image using createImageBitmap if supported
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(file);
    } catch (decodeErr: any) {
      const errorResponse: WorkerResponse = {
        type: "TASK_ERROR",
        taskId,
        error: {
          code: "ERR_DECODE_FAILED",
          message:
            decodeErr?.message ||
            "Failed to decode image file. File may be corrupted or unsupported.",
        },
      };
      ctx.postMessage(errorResponse);
      return;
    }

    const origW = bitmap.width;
    const origH = bitmap.height;

    // 2. Calculate target dimensions & cropping
    const { canvasWidth, canvasHeight, cropRect } = calculateTargetDimensions(
      origW,
      origH,
      config,
      customCrop
    );

    // 3. Determine output format
    let targetMimeType = "image/jpeg";
    if (config.outputFormat === "original") {
      targetMimeType = file.type || "image/jpeg";
    } else {
      targetMimeType = `image/${getImageExtension(config.outputFormat)}`;
    }

    // 4. Render on OffscreenCanvas
    let outputBlob: Blob;

    if (typeof OffscreenCanvas !== "undefined") {
      const offscreen = new OffscreenCanvas(canvasWidth, canvasHeight);
      const ctx2d = offscreen.getContext("2d");

      if (!ctx2d) {
        throw new Error("Failed to acquire 2D context on OffscreenCanvas.");
      }

      drawImageHighQuality(
        ctx2d,
        bitmap,
        cropRect,
        canvasWidth,
        canvasHeight
      );

      // Clean up ImageBitmap immediately to release memory
      bitmap.close();

      const qualityRatio = Math.max(0.01, Math.min(1.0, config.quality / 100));

      try {
        outputBlob = await offscreen.convertToBlob({
          type: targetMimeType,
          quality: qualityRatio,
        });
      } catch (encodeErr: any) {
        // Fallback to image/jpeg if specific format (like AVIF/WebP) fails encoding
        if (targetMimeType !== "image/jpeg") {
          targetMimeType = "image/jpeg";
          outputBlob = await offscreen.convertToBlob({
            type: "image/jpeg",
            quality: qualityRatio,
          });
        } else {
          throw encodeErr;
        }
      }

      // Reset canvas size to free GPU memory
      offscreen.width = 0;
      offscreen.height = 0;
    } else {
      // In case worker lacks OffscreenCanvas, send error asking for main thread fallback
      bitmap.close();
      throw new Error("Worker environment does not support OffscreenCanvas.");
    }

    const durationMs = Math.round(performance.now() - startTime);
    const outputName = generateOutputFilename(
      file.name,
      config.filenamePattern,
      config.outputFormat === "original"
        ? file.type.replace("image/", "")
        : config.outputFormat
    );

    const resultPayload: ImageProcessingResult = {
      blob: outputBlob,
      outputWidth: canvasWidth,
      outputHeight: canvasHeight,
      outputSize: outputBlob.size,
      outputFormat: targetMimeType,
      outputName,
      durationMs,
    };

    const successResponse: WorkerResponse = {
      type: "TASK_SUCCESS",
      taskId,
      result: resultPayload,
    };

    ctx.postMessage(successResponse);
  } catch (err: any) {
    const errorResponse: WorkerResponse = {
      type: "TASK_ERROR",
      taskId,
      error: {
        code: "ERR_RESIZE_FAILED",
        message: err?.message || "An error occurred during image resizing.",
      },
    };
    ctx.postMessage(errorResponse);
  }
});
