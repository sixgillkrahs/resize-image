import React from "react";
import { ShieldCheck, Zap, Image as ImageIcon } from "lucide-react";

export const Header: React.FC = () => {
  return (
    <header className="w-full border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50 px-4 lg:px-8 py-3.5 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-sky-500/30 text-sky-400 shadow-lg shadow-sky-500/10">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
              PicPress Pro
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-sky-300 border border-sky-500/30 shadow-sm">
                Resize & Nén Ảnh
              </span>
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">
              Xử lý ảnh hàng loạt siêu tốc 100% trên trình duyệt
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold shadow-sm transition-all hover:bg-emerald-500/20 cursor-default">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% Bảo mật (Không tải lên Server)</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold shadow-sm transition-all hover:bg-indigo-500/20 cursor-default">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span>Đã bật Web Workers</span>
          </div>
        </div>
      </div>
    </header>
  );
};
