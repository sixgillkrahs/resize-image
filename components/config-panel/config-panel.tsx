"use client";

import React, { useEffect, useState } from "react";
import { Sliders, Maximize2, FileType, Sparkles, Image as ImageIcon } from "lucide-react";
import { useImageStore } from "@/stores/use-image-store";
import { OutputFormat, ResizeMode, PHOTO_PRESETS } from "@/types/config";
import { detectBrowserCapabilities } from "@/features/image-processing/format-checker";

export const ConfigPanel: React.FC = () => {
  const config = useImageStore((s) => s.config);
  const updateConfig = useImageStore((s) => s.updateConfig);
  const items = useImageStore((s) => s.items);

  const [hasAvif, setHasAvif] = useState(false);

  useEffect(() => {
    detectBrowserCapabilities().then((caps) => {
      setHasAvif(caps.hasAvifExport);
    });
  }, []);

  const handleModeChange = (mode: ResizeMode) => {
    updateConfig({ mode });
  };

  const handleSelectPreset = (presetId: string) => {
    const preset = PHOTO_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      updateConfig({
        mode: "preset",
        selectedPresetId: presetId,
        width: preset.width,
        height: preset.height,
      });
    }
  };

  const handleFormatChange = (outputFormat: OutputFormat) => {
    updateConfig({ outputFormat });
  };

  if (items.length === 0) return null;

  return (
    <div className="w-full glass-panel rounded-3xl p-6 md:p-7 space-y-6 border border-slate-800 shadow-xl">
      {/* Panel Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-md">
          <Sliders className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-extrabold text-white text-base tracking-tight">Cấu hình Resize</h3>
          <p className="text-xs text-slate-400">
            Đặt kích thước, chế độ và định dạng cho toàn bộ ảnh
          </p>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
          <span>Chế độ Resize</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {[
            { id: "preset", label: "Kích thước In ảnh", desc: "6x9, 5x7, 10x15..." },
            { id: "max-dimension", label: "Cạnh dài nhất", desc: "Giữ tỷ lệ cạnh dài" },
            { id: "keep-aspect-width", label: "Ưu tiên Rộng", desc: "Tự tính chiều cao" },
            { id: "keep-aspect-height", label: "Ưu tiên Cao", desc: "Tự tính chiều rộng" },
            { id: "fit", label: "Cố định (Fit)", desc: "Nằm gọn trong khung" },
            { id: "fill-crop", label: "Vừa khung (Crop)", desc: "Phủ kín và cắt giữa" },
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => handleModeChange(mode.id as ResizeMode)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                config.mode === mode.id
                  ? "bg-sky-500/20 border-sky-500/60 text-sky-300 shadow-lg shadow-sky-500/10 scale-[1.02]"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              <div className="text-xs font-bold">{mode.label}</div>
              <div className="text-[10px] opacity-75 mt-0.5">{mode.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Photo Print Presets Grid (6x9, 5x7, 10x15, 13x18) */}
      {config.mode === "preset" && (
        <div className="space-y-2.5 pt-3 border-t border-slate-800/80">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
            <span>Chọn Kích Thước In Ảnh</span>
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {PHOTO_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.id)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  config.selectedPresetId === preset.id
                    ? "bg-sky-500/20 border-sky-500 text-sky-300 shadow-md scale-[1.02]"
                    : "bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                <div className="text-xs font-bold text-white">{preset.name}</div>
                <div className="text-[11px] font-mono text-sky-400 font-semibold mt-0.5">
                  {preset.width} x {preset.height} px
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Target Dimensions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {config.mode === "max-dimension" ? (
          <div className="space-y-1.5 col-span-full">
            <label className="text-xs font-semibold text-slate-300">
              Kích thước cạnh dài nhất (Pixels)
            </label>
            <input
              type="number"
              min={1}
              max={10000}
              value={config.maxDimension}
              onChange={(e) =>
                updateConfig({ maxDimension: parseInt(e.target.value) || 100 })
              }
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
            />
          </div>
        ) : config.mode !== "preset" ? (
          <>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Chiều rộng mong muốn (px)
              </label>
              <input
                type="number"
                min={1}
                max={10000}
                value={config.width}
                onChange={(e) =>
                  updateConfig({ width: parseInt(e.target.value) || 100 })
                }
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Chiều cao mong muốn (px)
              </label>
              <input
                type="number"
                min={1}
                max={10000}
                value={config.height}
                onChange={(e) =>
                  updateConfig({ height: parseInt(e.target.value) || 100 })
                }
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
              />
            </div>
          </>
        ) : null}
      </div>

      {/* Format & Quality */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-slate-800/80">
        {/* Output Format */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <FileType className="w-3.5 h-3.5 text-sky-400" />
            <span>Định dạng đầu ra</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "original", label: "Giữ định dạng gốc" },
              { id: "jpeg", label: "JPEG" },
              { id: "png", label: "PNG" },
              { id: "webp", label: "WebP" },
              { id: "avif", label: hasAvif ? "AVIF" : "AVIF (N/A)" },
            ].map((fmt) => (
              <button
                key={fmt.id}
                type="button"
                onClick={() => handleFormatChange(fmt.id as OutputFormat)}
                disabled={fmt.id === "avif" && !hasAvif}
                className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  config.outputFormat === fmt.id
                    ? "bg-sky-500/20 border-sky-500 text-sky-300 shadow-md"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                } ${fmt.id === "avif" && !hasAvif ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                {fmt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quality Slider */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Chất lượng ảnh</span>
            </label>
            <span className="font-mono text-sky-400 font-extrabold text-sm">
              {config.quality}%
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            value={config.quality}
            onChange={(e) => updateConfig({ quality: parseInt(e.target.value) })}
            className="w-full accent-sky-400 cursor-pointer h-2 bg-slate-950 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-medium">
            <span>Thấp (File nhẹ)</span>
            <span>Cân bằng</span>
            <span>Cao nhất (100%)</span>
          </div>
        </div>
      </div>

      {/* Filename Pattern */}
      <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
        <label className="text-xs font-semibold text-slate-300">
          Mẫu tên tệp đầu ra
        </label>
        <input
          type="text"
          value={config.filenamePattern}
          onChange={(e) => updateConfig({ filenamePattern: e.target.value })}
          placeholder="{name}_resized"
          className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
        />
        <p className="text-[10px] text-slate-500">
          Sử dụng <code className="text-sky-400 font-semibold">{"{name}"}</code> để giữ tên gốc, ví dụ: <code className="text-slate-400">{"{name}_da_resize"}</code>
        </p>
      </div>
    </div>
  );
};
