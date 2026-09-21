export type ImageItemStatus =
  | "pending"
  | "scanning"
  | "ready"
  | "processing"
  | "success"
  | "failed";

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number; // in bytes
  name: string;
  type: string;
}

export interface ImageProcessingResult {
  blob: Blob;
  outputWidth: number;
  outputHeight: number;
  outputSize: number;
  outputFormat: string;
  outputName: string;
  durationMs: number;
}

export interface ImageProcessingError {
  code:
    | "ERR_UNSUPPORTED_FORMAT"
    | "ERR_CORRUPTED_FILE"
    | "ERR_DECODE_FAILED"
    | "ERR_WORKER_OOM"
    | "ERR_RESIZE_FAILED"
    | "ERR_ENCODE_FAILED"
    | "ERR_ABORTED"
    | "ERR_UNKNOWN";
  message: string;
}

export interface CropArea {
  x: number; // 0 to 1 relative position
  y: number; // 0 to 1 relative position
  width: number; // 0 to 1 relative size
  height: number; // 0 to 1 relative size
}

export interface ImageItem {
  id: string;
  file: File;
  previewUrl?: string;
  status: ImageItemStatus;
  metadata?: ImageMetadata;
  result?: ImageProcessingResult;
  error?: ImageProcessingError;
  progress?: number; // 0 - 100
  customCrop?: CropArea;
}
