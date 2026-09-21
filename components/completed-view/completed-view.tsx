"use client";

import React from "react";
import { Loader2, Sparkles, FolderArchive, RefreshCw } from "lucide-react";
import { useImageStore } from "@/stores/use-image-store";
import { formatBytes } from "@/utils/file-helpers";

export const CompletedView: React.FC = () => {
  const items = useImageStore((s) => s.items);
  const isZipBuilding = useImageStore((s) => s.isZipBuilding);
  const zipProgress = useImageStore((s) => s.zipProgress);
  const downloadAllZip = useImageStore((s) => s.downloadAllZip);
  const clearAll = useImageStore((s) => s.clearAll);

  const successItems = items.filter((it) => it.status === "success" && it.result);
  if (successItems.length === 0) return null;

  const originalTotalBytes = successItems.reduce(
    (acc, it) => acc + (it.metadata?.size || it.file.size),
    0
  );
  const resultTotalBytes = successItems.reduce(
    (acc, it) => acc + (it.result?.outputSize || 0),
    0
  );
  const savedBytes = Math.max(0, originalTotalBytes - resultTotalBytes);
  const savedPercent =
    originalTotalBytes > 0
      ? Math.round((savedBytes / originalTotalBytes) * 100)
      : 0;

  return (
    <div className="w-full glass-panel rounded-3xl p-6 md:p-7 border border-emerald-500/35 bg-emerald-500/10 space-y-4 shadow-xl shadow-emerald-500/5 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Đã hoàn thành xử lý hàng loạt!</span>
            </h3>
            <p className="text-xs md:text-sm text-slate-300 font-mono mt-1 font-medium">
              Đã xử lý {successItems.length} ảnh • Giảm từ{" "}
              {formatBytes(originalTotalBytes)} còn {formatBytes(resultTotalBytes)}{" "}
              <span className="text-emerald-400 font-bold">
                (Tiết kiệm {savedPercent}%: {formatBytes(savedBytes)})
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={downloadAllZip}
            disabled={isZipBuilding}
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/25 transition-all scale-100 hover:scale-[1.03] disabled:opacity-50 cursor-pointer"
          >
            {isZipBuilding ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
                <span>Đang nén tệp ZIP ({zipProgress}%)...</span>
              </>
            ) : (
              <>
                <FolderArchive className="w-5 h-5 text-slate-950" />
                <span>Tải tất cả dạng ZIP ({successItems.length})</span>
              </>
            )}
          </button>

          <button
            onClick={clearAll}
            className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Tạo danh sách mới</span>
          </button>
        </div>
      </div>
    </div>
  );
};
