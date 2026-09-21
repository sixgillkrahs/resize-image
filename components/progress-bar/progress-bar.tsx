"use client";

import React from "react";
import { Play, Pause, XCircle, RotateCcw, Zap } from "lucide-react";
import { useImageStore } from "@/stores/use-image-store";

export const ProgressBar: React.FC = () => {
  const items = useImageStore((s) => s.items);
  const status = useImageStore((s) => s.status);
  const activeItemName = useImageStore((s) => s.activeItemName);
  const startProcessing = useImageStore((s) => s.startProcessing);
  const pauseProcessing = useImageStore((s) => s.pauseProcessing);
  const resumeProcessing = useImageStore((s) => s.resumeProcessing);
  const cancelProcessing = useImageStore((s) => s.cancelProcessing);
  const retryFailed = useImageStore((s) => s.retryFailed);

  if (items.length === 0) return null;

  const total = items.length;
  const processed = items.filter((it) => it.status === "success").length;
  const failed = items.filter((it) => it.status === "failed").length;
  const finishedCount = processed + failed;
  const overallPercent = total > 0 ? Math.round((finishedCount / total) * 100) : 0;

  return (
    <div className="w-full glass-panel rounded-3xl p-6 md:p-7 space-y-5 border border-slate-800 shadow-xl">
      {/* Top Header & Trigger Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-white text-lg tracking-tight flex items-center gap-2.5">
            <span>Tiến trình xử lý</span>
            {status === "processing" && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30 animate-pulse">
                Đang chạy luồng Worker...
              </span>
            )}
            {status === "completed" && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Đã hoàn thành
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-1 font-medium">
            {processed} / {total} đã xử lý ({failed} lỗi)
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {status === "idle" && (
            <button
              onClick={startProcessing}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-sky-500/25 transition-all scale-100 hover:scale-[1.03] cursor-pointer btn-glow-primary"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Resize Tất cả ({total})</span>
            </button>
          )}

          {status === "processing" && (
            <>
              <button
                onClick={pauseProcessing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-colors cursor-pointer shadow-md"
              >
                <Pause className="w-4 h-4" />
                <span>Tạm dừng</span>
              </button>
              <button
                onClick={cancelProcessing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer shadow-md"
              >
                <XCircle className="w-4 h-4" />
                <span>Hủy bỏ</span>
              </button>
            </>
          )}

          {status === "paused" && (
            <>
              <button
                onClick={resumeProcessing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-colors cursor-pointer shadow-md"
              >
                <Play className="w-4 h-4" />
                <span>Tiếp tục</span>
              </button>
              <button
                onClick={cancelProcessing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer shadow-md"
              >
                <XCircle className="w-4 h-4" />
                <span>Hủy bỏ</span>
              </button>
            </>
          )}

          {status === "completed" && (
            <button
              onClick={startProcessing}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-colors cursor-pointer shadow-md"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Chạy lại danh sách</span>
            </button>
          )}

          {failed > 0 && status !== "processing" && (
            <button
              onClick={retryFailed}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-bold transition-colors cursor-pointer shadow-md"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Thử lại {failed} ảnh lỗi</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="space-y-2">
        <div className="w-full bg-slate-950 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-800 shadow-inner">
          <div
            className="bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 h-full rounded-full transition-all duration-300 ease-out shadow-sm"
            style={{ width: `${overallPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 font-mono font-medium">
          <span>Hoàn thành {overallPercent}%</span>
          {activeItemName && status === "processing" && (
            <span className="truncate max-w-[280px] text-sky-400 font-semibold">
              Đang xử lý: {activeItemName}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
