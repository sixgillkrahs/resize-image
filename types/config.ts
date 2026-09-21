export type ResizeMode =
  | "exact"
  | "keep-aspect-width"
  | "keep-aspect-height"
  | "max-dimension"
  | "fit"
  | "fill-crop"
  | "preset";

export type OutputFormat = "original" | "jpeg" | "png" | "webp" | "avif";

export interface PhotoPreset {
  id: string;
  name: string;
  width: number;
  height: number;
  aspectRatio: number; // width / height
  unit: string;
}

export const PHOTO_PRESETS: PhotoPreset[] = [
  { id: "6x9", name: "6 x 9 cm (Độ nét cao)", width: 1417, height: 2126, aspectRatio: 6 / 9, unit: "cm" },
  { id: "5x7", name: "5 x 7 cm / in (Độ nét cao)", width: 1500, height: 2100, aspectRatio: 5 / 7, unit: "cm" },
  { id: "10x15", name: "10 x 15 cm (4x6\" chuẩn in 300DPI)", width: 1200, height: 1800, aspectRatio: 10 / 15, unit: "cm" },
  { id: "13x18", name: "13 x 18 cm (5x7\" chuẩn in 300DPI)", width: 1535, height: 2126, aspectRatio: 13 / 18, unit: "cm" },
  { id: "1x1", name: "1 : 1 Vuông", width: 1440, height: 1440, aspectRatio: 1, unit: "px" },
  { id: "16x9", name: "16 : 9 Màn ảnh rộng", width: 1920, height: 1080, aspectRatio: 16 / 9, unit: "px" },
];

export interface ResizeConfig {
  mode: ResizeMode;
  width: number;
  height: number;
  maxDimension: number;
  maintainAspectRatio: boolean;
  selectedPresetId?: string;
  outputFormat: OutputFormat;
  quality: number; // 1 - 100
  filenamePattern: string; // e.g., "{name}_resized"
}

export const DEFAULT_CONFIG: ResizeConfig = {
  mode: "max-dimension",
  width: 1920,
  height: 1080,
  maxDimension: 1920,
  maintainAspectRatio: true,
  selectedPresetId: undefined,
  outputFormat: "webp",
  quality: 85,
  filenamePattern: "{name}_resized",
};
