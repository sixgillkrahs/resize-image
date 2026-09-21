"use client";

import React, { useState } from "react";
import { Trash2, Plus, Image as ImageIcon } from "lucide-react";
import { useImageStore } from "@/stores/use-image-store";
import { ImageCard } from "./image-card";
import { CropModal } from "../crop-modal/crop-modal";
import { ImageItem, CropArea } from "@/types/image";

export const ImageGrid: React.FC = () => {
  const items = useImageStore((s) => s.items);
  const clearAll = useImageStore((s) => s.clearAll);
  const addFiles = useImageStore((s) => s.addFiles);
  const setItemCrop = useImageStore((s) => s.setItemCrop);
  const applyCropToAll = useImageStore((s) => s.applyCropToAll);

  const [cropModalItem, setCropModalItem] = useState<ImageItem | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAddMore = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveCrop = (crop: CropArea, applyToAllFlag: boolean) => {
    if (applyToAllFlag) {
      applyCropToAll(crop);
    } else if (cropModalItem) {
      setItemCrop(cropModalItem.id, crop);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* List Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-sky-400" />
          <h3 className="font-semibold text-white text-sm md:text-base">
            Danh sách ảnh ({items.length})
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleAddMore}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm ảnh</span>
          </button>

          <button
            onClick={clearAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-medium transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa tất cả</span>
          </button>
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[650px] overflow-y-auto pr-1">
        {items.map((item) => (
          <ImageCard
            key={item.id}
            item={item}
            onOpenCrop={(target) => setCropModalItem(target)}
          />
        ))}
      </div>

      {/* Interactive Drag & Drop Crop Modal */}
      <CropModal
        item={cropModalItem}
        isOpen={!!cropModalItem}
        onClose={() => setCropModalItem(null)}
        onSaveCrop={handleSaveCrop}
      />
    </div>
  );
};
