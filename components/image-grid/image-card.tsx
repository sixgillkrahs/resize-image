"use client";

import React from "react";
import {
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileImage,
  Crop,
  Download,
} from "lucide-react";
import { ImageItem } from "@/types/image";
import { formatBytes } from "@/utils/file-helpers";
import { useImageStore } from "@/stores/use-image-store";

interface ImageCardProps {
  item: ImageItem;
  onOpenCrop?: (item: ImageItem) => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({ item, onOpenCrop }) => {
  const removeFile = useImageStore((s) => s.removeFile);
  const downloadSingle = useImageStore((s) => s.downloadSingle);

  return (
    <div className="group relative rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden glass-panel-hover flex flex-col justify-between p-3.5 gap-3 shadow-lg">
      {/* Top Bar with Status & Remove button */}
      <div className="flex items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-1.5 min-w-0">
          {item.status === "processing" && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Đang xử lý...</span>
            </span>
          )}
          {item.status === "success" && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" />
              <span>Hoàn thành</span>
            </span>
          )}
          {item.status === "failed" && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertCircle className="w-3 h-3" />
              <span>Lỗi</span>
            </span>
          )}
          {(item.status === "ready" || item.status === "pending") && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              Sẵn sàng
            </span>
          )}
          {item.customCrop && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
              Đã cắt
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {onOpenCrop && (
            <button
              onClick={() => onOpenCrop(item)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-colors cursor-pointer"
              title="Cắt & Chỉnh sửa ảnh"
            >
              <Crop className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => removeFile(item.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Xóa ảnh khỏi danh sách"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Thumbnail Container */}
      <div
        onClick={() => onOpenCrop && onOpenCrop(item)}
        className="relative w-full h-36 rounded-xl bg-slate-950/80 overflow-hidden border border-slate-800/80 flex items-center justify-center cursor-pointer group/thumb"
      >
        {item.previewUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={item.previewUrl}
            alt={item.file.name}
            className="w-full h-full object-contain transition-transform group-hover/thumb:scale-105 duration-300"
          />
        ) : (
          <FileImage className="w-10 h-10 text-slate-600" />
        )}

        {/* Hover overlay hint */}
        <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs shadow-lg shadow-sky-500/20">
            <Crop className="w-3.5 h-3.5" />
            <span>Cắt & Chỉnh sửa</span>
          </span>
        </div>

        {/* Saved Space Badge if Success */}
        {item.result && (
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-slate-900/90 backdrop-blur border border-slate-700 text-[10px] font-mono text-emerald-400 font-bold shadow">
            {formatBytes(item.result.outputSize)}
          </div>
        )}
      </div>

      {/* Metadata & Actions */}
      <div className="space-y-1.5 text-xs">
        <p
          className="font-semibold text-slate-200 truncate"
          title={item.file.name}
        >
          {item.file.name}
        </p>

        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>
            {item.metadata
              ? `${item.metadata.width}x${item.metadata.height}px`
              : "Đang quét..."}
          </span>
          <span>{formatBytes(item.file.size)}</span>
        </div>

        {/* Resized Result Info */}
        {item.result && (
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <div className="text-[11px] font-mono text-sky-400 font-semibold truncate">
              {item.result.outputWidth}x{item.result.outputHeight}px (
              {item.result.durationMs}ms)
            </div>

            <button
              onClick={() => downloadSingle(item.id)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[11px] font-bold transition-all cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Lưu</span>
            </button>
          </div>
        )}

        {/* Error Message */}
        {item.error && (
          <p className="text-[11px] text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20 truncate font-mono">
            {item.error.message}
          </p>
        )}
      </div>
    </div>
  );
};
