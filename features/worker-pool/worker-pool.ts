import { ResizeConfig } from "@/types/config";
import { CropArea, ImageProcessingError, ImageProcessingResult } from "@/types/image";
import { WorkerRequest, WorkerResponse } from "@/types/worker";
import { calculateTargetDimensions } from "../image-processing/resize-calculator";
import { drawImageHighQuality } from "../image-processing/resample-engine";
import { generateOutputFilename, getImageExtension } from "@/utils/file-helpers";

export interface TaskJob {
  taskId: string;
  file: File;
  config: ResizeConfig;
  customCrop?: CropArea;
  onSuccess: (result: ImageProcessingResult) => void;
  onError: (error: ImageProcessingError) => void;
  onProgress?: (percent: number) => void;
}

interface WorkerInstance {
  id: number;
  worker: Worker | null;
  isBusy: boolean;
  currentTaskId: string | null;
}

export class WorkerPoolManager {
  private poolSize: number;
  private workers: WorkerInstance[] = [];
  private taskQueue: TaskJob[] = [];
  private activeTasks: Map<string, TaskJob> = new Map();
  private isPaused: boolean = false;
  private isCanceled: boolean = false;

  constructor(maxConcurrency?: number) {
    if (typeof window !== "undefined") {
      const cores = navigator.hardwareConcurrency || 4;
      this.poolSize = maxConcurrency ?? Math.max(1, Math.min(cores - 1, 6));
    } else {
      this.poolSize = 4;
    }
  }

  /**
   * Initialize worker pool
   */
  public init(): void {
    if (typeof window === "undefined" || this.workers.length > 0) return;

    for (let i = 0; i < this.poolSize; i++) {
      this.workers.push({
        id: i,
        worker: this.createWorker(i),
        isBusy: false,
        currentTaskId: null,
      });
    }
  }

  private createWorker(index: number): Worker | null {
    try {
      const worker = new Worker(
        new URL("./image.worker.ts", import.meta.url),
        { type: "module" }
      );

      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        this.handleWorkerMessage(index, event.data);
      };

      worker.onerror = (err) => {
        console.error(`Worker #${index} runtime error:`, err);
        this.handleWorkerCrash(index, err);
      };

      return worker;
    } catch (e) {
      console.warn("Failed to instantiate Web Worker. Will fallback to Main Thread.", e);
      return null;
    }
  }

  private handleWorkerMessage(workerIndex: number, response: WorkerResponse): void {
    const workerInst = this.workers[workerIndex];
    if (!workerInst) return;

    const job = this.activeTasks.get(response.taskId);

    if (response.type === "TASK_SUCCESS") {
      workerInst.isBusy = false;
      workerInst.currentTaskId = null;
      this.activeTasks.delete(response.taskId);

      if (job) job.onSuccess(response.result);
      this.dispatchNext();
    } else if (response.type === "TASK_ERROR") {
      workerInst.isBusy = false;
      workerInst.currentTaskId = null;
      this.activeTasks.delete(response.taskId);

      if (job) job.onError(response.error);
      this.dispatchNext();
    } else if (response.type === "TASK_PROGRESS") {
      if (job && job.onProgress) {
        job.onProgress(response.progress);
      }
    }
  }

  private handleWorkerCrash(workerIndex: number, error: any): void {
    const workerInst = this.workers[workerIndex];
    if (!workerInst) return;

    if (workerInst.currentTaskId) {
      const job = this.activeTasks.get(workerInst.currentTaskId);
      if (job) {
        job.onError({
          code: "ERR_WORKER_OOM",
          message: "Worker crashed while processing image.",
        });
        this.activeTasks.delete(workerInst.currentTaskId);
      }
    }

    if (workerInst.worker) {
      try {
        workerInst.worker.terminate();
      } catch {}
    }

    workerInst.worker = this.createWorker(workerIndex);
    workerInst.isBusy = false;
    workerInst.currentTaskId = null;

    this.dispatchNext();
  }

  /**
   * Add a task to queue
   */
  public enqueue(job: TaskJob): void {
    if (this.isCanceled) return;
    this.taskQueue.push(job);
    this.dispatchNext();
  }

  /**
   * Dispatch tasks to idle workers
   */
  private dispatchNext(): void {
    if (this.isPaused || this.isCanceled || this.taskQueue.length === 0) return;

    const idleWorker = this.workers.find((w) => !w.isBusy);
    if (!idleWorker) return;

    const job = this.taskQueue.shift();
    if (!job) return;

    idleWorker.isBusy = true;
    idleWorker.currentTaskId = job.taskId;
    this.activeTasks.set(job.taskId, job);

    if (idleWorker.worker) {
      const request: WorkerRequest = {
        type: "PROCESS_IMAGE",
        taskId: job.taskId,
        file: job.file,
        config: job.config,
        customCrop: job.customCrop,
      };
      idleWorker.worker.postMessage(request);
    } else {
      // Main Thread Fallback for legacy environments
      this.processOnMainThread(job).then(() => {
        idleWorker.isBusy = false;
        idleWorker.currentTaskId = null;
        this.dispatchNext();
      });
    }
  }

  /**
   * Fallback image processing on Main Thread
   */
  private async processOnMainThread(job: TaskJob): Promise<void> {
    const startTime = performance.now();
    try {
      const bitmap = await createImageBitmap(job.file);
      const { canvasWidth, canvasHeight, cropRect } = calculateTargetDimensions(
        bitmap.width,
        bitmap.height,
        job.config,
        job.customCrop
      );

      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not create canvas 2d context");

      drawImageHighQuality(
        ctx,
        bitmap,
        cropRect,
        canvasWidth,
        canvasHeight
      );

      bitmap.close();

      let targetMimeType = "image/jpeg";
      if (job.config.outputFormat === "original") {
        targetMimeType = job.file.type || "image/jpeg";
      } else {
        targetMimeType = `image/${getImageExtension(job.config.outputFormat)}`;
      }

      const qualityRatio = Math.max(0.01, Math.min(1.0, job.config.quality / 100));

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error("Main thread canvas toBlob failed."));
          },
          targetMimeType,
          qualityRatio
        );
      });

      const outputName = generateOutputFilename(
        job.file.name,
        job.config.filenamePattern,
        job.config.outputFormat === "original"
          ? job.file.type.replace("image/", "")
          : job.config.outputFormat
      );

      const durationMs = Math.round(performance.now() - startTime);

      job.onSuccess({
        blob,
        outputWidth: canvasWidth,
        outputHeight: canvasHeight,
        outputSize: blob.size,
        outputFormat: targetMimeType,
        outputName,
        durationMs,
      });
    } catch (e: any) {
      job.onError({
        code: "ERR_RESIZE_FAILED",
        message: e?.message || "Main thread resize failed",
      });
    }
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
    this.dispatchNext();
  }

  public cancel(): void {
    this.isCanceled = true;
    this.taskQueue = [];

    this.activeTasks.forEach((job) => {
      job.onError({
        code: "ERR_ABORTED",
        message: "Processing canceled by user.",
      });
    });
    this.activeTasks.clear();

    for (const w of this.workers) {
      if (w.worker) {
        try {
          w.worker.terminate();
        } catch {}
      }
      w.isBusy = false;
      w.currentTaskId = null;
    }

    this.workers = [];
    this.isCanceled = false;
    this.isPaused = false;
    this.init();
  }

  public destroy(): void {
    this.cancel();
  }
}
