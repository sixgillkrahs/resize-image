import { ResizeConfig } from "./config";
import { CropArea, ImageProcessingError, ImageProcessingResult } from "./image";

export type WorkerMessageType =
  | "PROCESS_IMAGE"
  | "ABORT_TASK";

export interface WorkerProcessRequest {
  type: "PROCESS_IMAGE";
  taskId: string;
  file: File;
  config: ResizeConfig;
  customCrop?: CropArea;
}

export type WorkerRequest = WorkerProcessRequest;

export interface WorkerSuccessResponse {
  type: "TASK_SUCCESS";
  taskId: string;
  result: ImageProcessingResult;
}

export interface WorkerErrorResponse {
  type: "TASK_ERROR";
  taskId: string;
  error: ImageProcessingError;
}

export interface WorkerProgressResponse {
  type: "TASK_PROGRESS";
  taskId: string;
  progress: number;
}

export type WorkerResponse =
  | WorkerSuccessResponse
  | WorkerErrorResponse
  | WorkerProgressResponse;
