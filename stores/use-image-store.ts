import { create } from "zustand";
import { DEFAULT_CONFIG, ResizeConfig } from "@/types/config";
import { ImageItem, ImageProcessingResult, CropArea } from "@/types/image";
import { WorkerPoolManager } from "@/features/worker-pool/worker-pool";
import { cleanupImageItemUrls, revokeUrl } from "@/utils/memory-cleaner";
import { createZipArchive } from "@/features/zip-export/zip-builder";
import { downloadBlob } from "@/features/zip-export/file-saver";

export type BatchStatus =
  | "idle"
  | "scanning"
  | "processing"
  | "paused"
  | "completed";

interface ImageStoreState {
  items: ImageItem[];
  config: ResizeConfig;
  status: BatchStatus;
  isZipBuilding: boolean;
  zipProgress: number;
  activeItemName?: string;

  // Actions
  addFiles: (files: File[]) => Promise<void>;
  removeFile: (id: string) => void;
  clearAll: () => void;
  updateConfig: (config: Partial<ResizeConfig>) => void;
  startProcessing: () => void;
  pauseProcessing: () => void;
  resumeProcessing: () => void;
  cancelProcessing: () => void;
  retryFailed: () => void;
  downloadSingle: (id: string) => void;
  downloadAllZip: () => Promise<void>;
  setItemCrop: (id: string, crop: CropArea) => void;
  applyCropToAll: (crop: CropArea) => void;
}

let poolManager: WorkerPoolManager | null = null;

function getPoolManager(): WorkerPoolManager {
  if (!poolManager) {
    poolManager = new WorkerPoolManager();
    poolManager.init();
  }
  return poolManager;
}

export const useImageStore = create<ImageStoreState>((set, get) => ({
  items: [],
  config: DEFAULT_CONFIG,
  status: "idle",
  isZipBuilding: false,
  zipProgress: 0,
  activeItemName: undefined,

  addFiles: async (newFiles: File[]) => {
    if (newFiles.length === 0) return;

    // Filter valid image files
    const validFiles = newFiles.filter((f) => f.type.startsWith("image/"));

    const newItems: ImageItem[] = validFiles.map((file, idx) => ({
      id: `${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
      file,
      status: "scanning",
      progress: 0,
    }));

    set((state) => ({
      items: [...state.items, ...newItems],
      status: state.items.length === 0 ? "scanning" : state.status,
    }));

    // Extract metadata asynchronously in background without blocking UI
    for (const item of newItems) {
      try {
        const previewUrl = URL.createObjectURL(item.file);
        let width = 0;
        let height = 0;

        if (typeof createImageBitmap !== "undefined") {
          try {
            const bitmap = await createImageBitmap(item.file);
            width = bitmap.width;
            height = bitmap.height;
            bitmap.close();
          } catch {}
        }

        set((state) => ({
          items: state.items.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  previewUrl,
                  status: "ready",
                  metadata: {
                    width,
                    height,
                    format: item.file.type.replace("image/", "").toUpperCase(),
                    size: item.file.size,
                    name: item.file.name,
                    type: item.file.type,
                  },
                }
              : it
          ),
        }));
      } catch (err) {
        set((state) => ({
          items: state.items.map((it) =>
            it.id === item.id ? { ...it, status: "ready" } : it
          ),
        }));
      }
    }

    set((state) => ({
      status: state.status === "scanning" ? "idle" : state.status,
    }));
  },

  removeFile: (id: string) => {
    set((state) => {
      const target = state.items.find((it) => it.id === id);
      if (target) {
        revokeUrl(target.previewUrl);
      }
      return {
        items: state.items.filter((it) => it.id !== id),
      };
    });
  },

  clearAll: () => {
    const manager = getPoolManager();
    manager.cancel();

    set((state) => {
      cleanupImageItemUrls(state.items);
      return {
        items: [],
        status: "idle",
        activeItemName: undefined,
      };
    });
  },

  updateConfig: (partial: Partial<ResizeConfig>) => {
    set((state) => {
      const updated = { ...state.config, ...partial };
      // Auto synchronize aspect ratio dimensions if keep-aspect mode selected
      if (partial.mode === "keep-aspect-width" && !partial.height) {
        // Will be dynamically calculated per image
      }
      return { config: updated };
    });
  },

  startProcessing: () => {
    const { items, config } = get();
    const readyItems = items.filter(
      (it) => it.status === "ready" || it.status === "pending" || it.status === "failed"
    );

    if (readyItems.length === 0) return;

    set({ status: "processing" });
    const manager = getPoolManager();

    readyItems.forEach((item) => {
      set((state) => ({
        items: state.items.map((it) =>
          it.id === item.id ? { ...it, status: "processing", progress: 10 } : it
        ),
      }));

      manager.enqueue({
        taskId: item.id,
        file: item.file,
        config,
        customCrop: item.customCrop,
        onSuccess: (result: ImageProcessingResult) => {
          set((state) => {
            const updatedItems = state.items.map((it) =>
              it.id === item.id
                ? {
                    ...it,
                    status: "success" as const,
                    result,
                    progress: 100,
                  }
                : it
            );

            const remaining = updatedItems.filter(
              (it) => it.status === "processing"
            );
            const isFinished = remaining.length === 0;

            return {
              items: updatedItems,
              status: isFinished ? "completed" : "processing",
              activeItemName: item.file.name,
            };
          });
        },
        onError: (error) => {
          set((state) => {
            const updatedItems = state.items.map((it) =>
              it.id === item.id
                ? {
                    ...it,
                    status: "failed" as const,
                    error,
                    progress: 0,
                  }
                : it
            );

            const remaining = updatedItems.filter(
              (it) => it.status === "processing"
            );
            const isFinished = remaining.length === 0;

            return {
              items: updatedItems,
              status: isFinished ? "completed" : "processing",
            };
          });
        },
      });
    });
  },

  pauseProcessing: () => {
    const manager = getPoolManager();
    manager.pause();
    set({ status: "paused" });
  },

  resumeProcessing: () => {
    const manager = getPoolManager();
    manager.resume();
    set({ status: "processing" });
  },

  cancelProcessing: () => {
    const manager = getPoolManager();
    manager.cancel();
    set((state) => ({
      status: "idle",
      items: state.items.map((it) =>
        it.status === "processing"
          ? { ...it, status: "ready" as const, progress: 0 }
          : it
      ),
      activeItemName: undefined,
    }));
  },

  retryFailed: () => {
    const { items } = get();
    const failedItems = items.filter((it) => it.status === "failed");
    if (failedItems.length === 0) return;

    set((state) => ({
      items: state.items.map((it) =>
        it.status === "failed"
          ? { ...it, status: "ready" as const, error: undefined }
          : it
      ),
    }));

    get().startProcessing();
  },

  downloadSingle: (id: string) => {
    const { items } = get();
    const item = items.find((it) => it.id === id);
    if (item && item.result) {
      downloadBlob(item.result.blob, item.result.outputName);
    }
  },

  downloadAllZip: async () => {
    const { items } = get();
    const successfulItems = items.filter(
      (it) => it.status === "success" && it.result
    );
    if (successfulItems.length === 0) return;

    set({ isZipBuilding: true, zipProgress: 0 });

    try {
      const zipBlob = await createZipArchive(successfulItems, (percent) => {
        set({ zipProgress: percent });
      });

      downloadBlob(zipBlob, `batch_resized_${Date.now()}.zip`);
    } catch (e: any) {
      alert(`ZIP creation failed: ${e.message}`);
    } finally {
      set({ isZipBuilding: false, zipProgress: 0 });
    }
  },

  setItemCrop: (id: string, crop: CropArea) => {
    set((state) => ({
      items: state.items.map((it) =>
        it.id === id ? { ...it, customCrop: crop } : it
      ),
    }));
  },

  applyCropToAll: (crop: CropArea) => {
    set((state) => ({
      items: state.items.map((it) => ({ ...it, customCrop: crop })),
    }));
  },
}));
