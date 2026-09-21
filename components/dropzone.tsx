"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, Sparkles } from "lucide-react";
import { useImageStore } from "@/stores/use-image-store";

export const Dropzone: React.FC = () => {
  const addFiles = useImageStore((s) => s.addFiles);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      await addFiles(filesArray);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      await addFiles(filesArray);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Generate sample synthetic canvas images for quick demonstration
  const handleAddSampleImages = async () => {
    const samples: File[] = [];
    const colors = ["#38bdf8", "#818cf8", "#a855f7", "#ec4899", "#10b981"];

    for (let i = 1; i <= 5; i++) {
      const canvas = document.createElement("canvas");
      canvas.width = 3840; // 4K high res sample
      canvas.height = 2160;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const grad = ctx.createLinearGradient(0, 0, 3840, 2160);
        grad.addColorStop(0, colors[i % colors.length]);
        grad.addColorStop(1, "#0f172a");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 3840, 2160);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 140px sans-serif";
        ctx.fillText(`Ảnh Mẫu Thử Nghiệm #${i} (4K UHD)`, 200, 1000);
        ctx.font = "70px sans-serif";
        ctx.fillText(`3840 x 2160 px - Chất Lượng Cao Canvas`, 200, 1150);
      }

      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b || new Blob()), "image/png")
      );
      samples.push(new File([blob], `Anh_Mau_4K_${i}.png`, { type: "image/png" }));
    }

    await addFiles(samples);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`group relative w-full rounded-3xl border-2 border-dashed p-8 md:p-14 text-center cursor-pointer transition-all duration-300 glass-panel ${
        isDragOver
          ? "border-sky-400 bg-sky-500/15 shadow-2xl shadow-sky-500/20 scale-[1.01]"
          : "border-slate-700/80 hover:border-sky-400/60 hover:bg-slate-900/60 hover:shadow-xl hover:shadow-sky-500/5"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center gap-5 max-w-md mx-auto">
        <div className="p-5 rounded-2xl bg-gradient-to-tr from-sky-500/20 via-indigo-500/20 to-purple-500/20 border border-slate-700/60 text-sky-400 shadow-xl group-hover:scale-110 group-hover:border-sky-400/50 transition-all duration-300">
          <UploadCloud className="w-12 h-12 stroke-[1.5]" />
        </div>

        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white mb-1.5 tracking-tight">
            Kéo & Thả ảnh của bạn vào đây
          </h2>
          <p className="text-sm text-slate-400">
            hoặc <span className="text-sky-400 font-bold underline underline-offset-4 hover:text-sky-300 transition-colors">duyệt chọn tệp</span> từ máy tính của bạn
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400 pt-1">
          <span className="px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800 font-mono text-[11px]">PNG</span>
          <span className="px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800 font-mono text-[11px]">JPEG</span>
          <span className="px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800 font-mono text-[11px]">WebP</span>
          <span className="px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800 font-mono text-[11px]">AVIF</span>
          <span className="px-3 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300 font-medium">Hàng loạt không giới hạn</span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleAddSampleImages();
          }}
          className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-semibold shadow-md transition-all scale-100 hover:scale-[1.03] cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Thêm 5 ảnh 4K thử nghiệm</span>
        </button>
      </div>
    </div>
  );
};
