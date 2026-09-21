"use client";

import React from "react";
import { Header } from "@/components/header";
import { Dropzone } from "@/components/dropzone";
import { ConfigPanel } from "@/components/config-panel/config-panel";
import { ProgressBar } from "@/components/progress-bar/progress-bar";
import { CompletedView } from "@/components/completed-view/completed-view";
import { ImageGrid } from "@/components/image-grid/image-grid";
import { useImageStore } from "@/stores/use-image-store";
import { ShieldCheck, Cpu, Zap, Lock } from "lucide-react";

export default function Home() {
  const items = useImageStore((s) => s.items);

  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-slate-100 selection:bg-sky-500/30 selection:text-sky-300">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 md:py-10 space-y-6">
        {/* Empty State Hero Banner when no items are uploaded */}
        {items.length === 0 && (
          <div className="text-center space-y-3 py-6 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5" />
              <span>Xử lý đa luồng tốc độ cao với Web Workers</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              PicPress Pro <br />
              <span className="gradient-text">Resize & Nén Ảnh Hàng Loạt</span>
            </h2>
            <p className="text-sm md:text-base text-slate-400 max-w-xl mx-auto">
              Xử lý, cắt và nén hàng trăm hoặc hàng nghìn ảnh nét cao tức thì ngay trên trình duyệt.
              Bảo mật 100%, không tải lên máy chủ, không giới hạn dung lượng.
            </p>
          </div>
        )}

        {/* Upload Dropzone */}
        {items.length === 0 ? (
          <Dropzone />
        ) : null}

        {/* Active Batch View */}
        {items.length > 0 && (
          <div className="space-y-6">
            <CompletedView />
            <ProgressBar />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Configuration Settings */}
              <div className="lg:col-span-4 space-y-6">
                <ConfigPanel />
              </div>

              {/* Right Column: Image Grid & Queue */}
              <div className="lg:col-span-8 space-y-6">
                <ImageGrid />
              </div>
            </div>
          </div>
        )}

        {/* Feature Highlights Footer Bar */}
        {items.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-10">
            <div className="p-4 rounded-xl glass-panel border border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
                <Lock className="w-4 h-4" />
                <span>Không tải ảnh lên Server</span>
              </div>
              <p className="text-xs text-slate-400">
                Ảnh của bạn không bao giờ rời khỏi máy tính. Toàn bộ quá trình giải mã, resize và đóng gói ZIP đều diễn ra trực tiếp trong trình duyệt.
              </p>
            </div>

            <div className="p-4 rounded-xl glass-panel border border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                <Cpu className="w-4 h-4" />
                <span>Xử lý Đa nhân Worker Pool</span>
              </div>
              <p className="text-xs text-slate-400">
                Tận dụng tối đa các nhân CPU của bạn với Web Workers và OffscreenCanvas giúp xử lý ảnh mượt mà không làm đơ giao diện.
              </p>
            </div>

            <div className="p-4 rounded-xl glass-panel border border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>An toàn Bộ nhớ & Sẵn sàng Scale</span>
              </div>
              <p className="text-xs text-slate-400">
                Được thiết kế với cơ chế dọn dẹp RAM nghiêm ngặt (`ImageBitmap.close()`) giúp xử lý mượt mà hàng ngàn ảnh mà không sập tab.
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-950/40 py-4 text-center text-xs text-slate-500">
        <p>PicPress Pro • Phát triển với Next.js 16 • React 19 • Web Workers • OffscreenCanvas • JSZip</p>
      </footer>
    </div>
  );
}
