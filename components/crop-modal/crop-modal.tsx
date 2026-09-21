"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Check, Crop, RotateCcw, Copy } from "lucide-react";
import { ImageItem, CropArea } from "@/types/image";
import { PHOTO_PRESETS } from "@/types/config";

interface CropModalProps {
  item: ImageItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveCrop: (crop: CropArea, applyToAll: boolean) => void;
}

export const CropModal: React.FC<CropModalProps> = ({
  item,
  isOpen,
  onClose,
  onSaveCrop,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [activeAspect, setActiveAspect] = useState<number | null>(null); // null = freeform
  const [selectedPresetId, setSelectedPresetId] = useState<string>("10x15");

  // Relative crop area (0 to 1)
  const [crop, setCrop] = useState<CropArea>({
    x: 0.1,
    y: 0.1,
    width: 0.8,
    height: 0.8,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<"move" | "nw" | "ne" | "sw" | "se" | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [initialCrop, setInitialCrop] = useState<CropArea>({ x: 0, y: 0, width: 1, height: 1 });

  // Initialize crop coordinates on item change
  useEffect(() => {
    if (item) {
      if (item.customCrop) {
        setCrop(item.customCrop);
      } else {
        // Default to center crop based on initial preset (10x15 = 2:3)
        const defaultPreset = PHOTO_PRESETS.find((p) => p.id === "10x15") || PHOTO_PRESETS[0];
        setActiveAspect(defaultPreset.aspectRatio);
        setCropByAspect(defaultPreset.aspectRatio);
      }
    }
  }, [item]);

  const setCropByAspect = (aspectRatio: number) => {
    if (!item?.metadata) {
      setCrop({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 });
      return;
    }

    const imgAspect = item.metadata.width / item.metadata.height;
    let w = 0.8;
    let h = 0.8;

    if (imgAspect > aspectRatio) {
      // Image is wider than target aspect -> height determines width
      h = 0.8;
      w = (h * aspectRatio) / imgAspect;
    } else {
      // Image is taller -> width determines height
      w = 0.8;
      h = (w * imgAspect) / aspectRatio;
    }

    const x = Math.max(0, (1 - w) / 2);
    const y = Math.max(0, (1 - h) / 2);

    setCrop({ x, y, width: w, height: h });
  };

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    if (presetId === "free") {
      setActiveAspect(null);
    } else {
      const preset = PHOTO_PRESETS.find((p) => p.id === presetId);
      if (preset) {
        setActiveAspect(preset.aspectRatio);
        setCropByAspect(preset.aspectRatio);
      }
    }
  };

  const getEventCoords = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if ("touches" in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
  };

  const handlePointerDown = (
    e: React.MouseEvent | React.TouchEvent,
    type: "move" | "nw" | "ne" | "sw" | "se"
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const coords = getEventCoords(e);
    setIsDragging(true);
    setDragType(type);
    setDragStart(coords);
    setInitialCrop({ ...crop });
  };

  const handlePointerMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !containerRef.current || !imgRef.current) return;

      const rect = imgRef.current.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const coords = getEventCoords(e);
      const deltaX = (coords.x - dragStart.x) / rect.width;
      const deltaY = (coords.y - dragStart.y) / rect.height;

      let { x, y, width, height } = initialCrop;

      if (dragType === "move") {
        x = Math.max(0, Math.min(1 - width, initialCrop.x + deltaX));
        y = Math.max(0, Math.min(1 - height, initialCrop.y + deltaY));
      } else if (dragType === "se") {
        let newW = Math.max(0.1, Math.min(1 - initialCrop.x, initialCrop.width + deltaX));
        let newH = activeAspect && item?.metadata
          ? (newW * item.metadata.width) / (activeAspect * item.metadata.height)
          : Math.max(0.1, Math.min(1 - initialCrop.y, initialCrop.height + deltaY));

        if (x + newW <= 1 && y + newH <= 1) {
          width = newW;
          height = newH;
        }
      } else if (dragType === "nw") {
        let newW = Math.max(0.1, initialCrop.width - deltaX);
        let newH = activeAspect && item?.metadata
          ? (newW * item.metadata.width) / (activeAspect * item.metadata.height)
          : Math.max(0.1, initialCrop.height - deltaY);

        let newX = initialCrop.x + (initialCrop.width - newW);
        let newY = initialCrop.y + (initialCrop.height - newH);

        if (newX >= 0 && newY >= 0) {
          x = newX;
          y = newY;
          width = newW;
          height = newH;
        }
      }

      setCrop({ x, y, width, height });
    },
    [isDragging, dragStart, dragType, initialCrop, activeAspect, item]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    setDragType(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handlePointerMove);
      window.addEventListener("mouseup", handlePointerUp);
      window.addEventListener("touchmove", handlePointerMove);
      window.addEventListener("touchend", handlePointerUp);
    }
    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchend", handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                Chỉnh sửa Vùng Cắt & Bố cục
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md">
                Kéo thả khung để căn chỉnh vị trí hoặc kéo góc để đổi kích thước
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Selector Bar */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase mr-1">
            KÍCH THƯỚC SẴN:
          </span>
          {PHOTO_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelectPreset(p.id)}
              className={`px-3 py-1 rounded-lg border text-xs font-medium transition-all ${
                selectedPresetId === p.id && activeAspect !== null
                  ? "bg-sky-500/20 border-sky-500 text-sky-300"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {p.name}
            </button>
          ))}
          <button
            onClick={() => handleSelectPreset("free")}
            className={`px-3 py-1 rounded-lg border text-xs font-medium transition-all ${
              selectedPresetId === "free" || activeAspect === null
                ? "bg-sky-500/20 border-sky-500 text-sky-300"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Tự do
          </button>
        </div>

        {/* Interactive Workspace / Canvas */}
        <div
          ref={containerRef}
          className="relative flex-1 p-6 flex items-center justify-center bg-slate-950 overflow-hidden min-h-[350px]"
        >
          {item.previewUrl && (
            <div className="relative inline-block select-none max-h-[55vh] max-w-full">
              {/* Main Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={item.previewUrl}
                alt={item.file.name}
                className="max-h-[55vh] max-w-full object-contain block pointer-events-none rounded"
              />

              {/* Dark Overlay Outside Crop */}
              <div className="absolute inset-0 bg-slate-950/65 pointer-events-none" />

              {/* Active Draggable Crop Box */}
              <div
                onMouseDown={(e) => handlePointerDown(e, "move")}
                onTouchStart={(e) => handlePointerDown(e, "move")}
                className="absolute border-2 border-sky-400 shadow-2xl cursor-move group transition-shadow"
                style={{
                  left: `${crop.x * 100}%`,
                  top: `${crop.y * 100}%`,
                  width: `${crop.width * 100}%`,
                  height: `${crop.height * 100}%`,
                  boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.65)",
                }}
              >
                {/* Rule of Thirds Grid Lines */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                  <div className="border-r border-b border-sky-300/40" />
                  <div className="border-r border-b border-sky-300/40" />
                  <div className="border-b border-sky-300/40" />
                  <div className="border-r border-b border-sky-300/40" />
                  <div className="border-r border-b border-sky-300/40" />
                  <div className="border-b border-sky-300/40" />
                  <div className="border-r border-sky-300/40" />
                  <div className="border-r border-sky-300/40" />
                  <div />
                </div>

                {/* Resize Handles */}
                <div
                  onMouseDown={(e) => handlePointerDown(e, "nw")}
                  onTouchStart={(e) => handlePointerDown(e, "nw")}
                  className="absolute -top-2 -left-2 w-4 h-4 bg-sky-400 border-2 border-slate-900 rounded-full cursor-nwse-resize shadow"
                />
                <div
                  onMouseDown={(e) => handlePointerDown(e, "se")}
                  onTouchStart={(e) => handlePointerDown(e, "se")}
                  className="absolute -bottom-2 -right-2 w-4 h-4 bg-sky-400 border-2 border-slate-900 rounded-full cursor-nwse-resize shadow"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-slate-900 border-t border-slate-800 gap-3">
          <button
            onClick={() => setCrop({ x: 0, y: 0, width: 1, height: 1 })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đặt lại khung cắt</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onSaveCrop(crop, true);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span>Áp dụng cho TẤT CẢ ảnh</span>
            </button>

            <button
              onClick={() => {
                onSaveCrop(crop, false);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-lg shadow-sky-500/20 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Lưu khung cắt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
