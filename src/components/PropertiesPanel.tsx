import React from "react";
import {
  Sliders,
  X,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Image as ImageIcon,
  Video,
  Music,
  Trash2,
  Scissors,
  Clock,
  Plus,
  Minus,
} from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { Element } from "@/types/editor";
import { cn } from "@/lib/utils";

export function PropertiesPanel() {
  const {
    pages,
    currentPageId,
    selectedElementId,
    updateElement,
    setSelectedElement,
    deleteElement,
    splitElement,
    timelinePosition,
    updatePage,
  } = useEditorStore();

  const currentPage = pages.find((p) => p.id === currentPageId);
  const selectedElement = currentPage?.elements.find(
    (el) => el.id === selectedElementId,
  );

  const handleUpdate = (updates: Partial<Element>) => {
    if (currentPageId && selectedElementId) {
      updateElement(currentPageId, selectedElementId, updates);
    }
  };

  const handleDelete = () => {
    if (currentPageId && selectedElementId) {
      deleteElement(currentPageId, selectedElementId);
    }
  };

  const handleLayerChange = (direction: "front" | "back") => {
    const newLayer = direction === "front" ? Date.now() : -Date.now();
    handleUpdate({ layer: newLayer } as any);
  };

  const handleSplit = () => {
    if (currentPageId && selectedElementId) {
      splitElement(currentPageId, selectedElementId, timelinePosition);
    }
  };

  const handlePageDurationChange = (amount: number) => {
    if (currentPageId && currentPage) {
      updatePage(currentPageId, {
        duration: Math.max(1, currentPage.duration + amount),
      });
    }
  };

  if (!selectedElement) {
    return (
      <div className="w-70 h-full bg-bg-app flex flex-col border-l border-border">
        <div className="h-14 flex items-center px-4 border-b border-border bg-bg-panel/50">
          <span className="text-[13px] font-bold text-text-main uppercase tracking-widest">
            Page Settings
          </span>
        </div>

        <div className="p-4 space-y-6">
          {/* Global Page Duration */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.15em]">
              Total Duration
            </label>
            <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-xl border border-border">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-accent" />
                <span className="text-sm font-bold text-text-main">
                  {currentPage?.duration}s
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageDurationChange(-5)}
                  className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-text-muted hover:text-text-main"
                >
                  <Minus size={14} />
                </button>
                <button
                  onClick={() => handlePageDurationChange(5)}
                  className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-text-muted hover:text-text-main"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center pt-24 text-text-muted space-y-4">
            <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center border border-border/50">
              <Sliders size={24} className="text-text-muted/50" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-text-main">
                No item selected
              </p>
              <p className="text-[11px] font-medium leading-relaxed max-w-[160px] mx-auto mt-1">
                Select an element on the canvas to edit its properties
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-70 h-full bg-bg-app flex flex-col border-l border-border animate-in slide-in-from-right duration-500">
      <div className="h-14 flex items-center justify-between px-4 border-b border-border bg-bg-panel/20">
        <span className="text-[13px] font-bold flex items-center gap-2 uppercase tracking-wide">
          {selectedElement.type === "text" && (
            <Type className="w-4 h-4 text-accent" />
          )}
          {selectedElement.type === "image" && (
            <ImageIcon className="w-4 h-4 text-accent" />
          )}
          {selectedElement.type === "video" && (
            <Video className="w-4 h-4 text-accent" />
          )}
          {selectedElement.type === "audio" && (
            <Music className="w-4 h-4 text-accent" />
          )}
          <span className="text-text-main">{selectedElement.type}</span>
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleDelete}
            className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors group relative"
          >
            <Trash2 className="w-4 h-4" />
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              Delete
            </span>
          </button>
          <button
            onClick={() => setSelectedElement(null)}
            className="p-2 text-text-muted hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 no-scrollbar">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleSplit}
            className="col-span-2 flex items-center justify-center gap-2 w-full py-2.5 bg-white text-black text-xs font-bold rounded-xl hover:bg-gray-200 transition-all active:scale-95"
          >
            <Scissors size={14} />
            Split at Playhead
          </button>
          <button
            onClick={() => handleLayerChange("front")}
            className="flex items-center justify-center gap-2 py-2 bg-secondary/20 border border-border text-[10px] font-bold rounded-lg hover:bg-secondary/30 transition-all text-text-main"
          >
            Bring Front
          </button>
          <button
            onClick={() => handleLayerChange("back")}
            className="flex items-center justify-center gap-2 py-2 bg-secondary/20 border border-border text-[10px] font-bold rounded-lg hover:bg-secondary/30 transition-all text-text-main"
          >
            Send Back
          </button>
        </div>

        {/* Timing Control */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.15em]">
            Timing & Duration
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <span className="text-[10px] text-text-muted font-bold ml-1">
                START (S)
              </span>
              <input
                type="number"
                step="0.1"
                min="0"
                className="w-full px-3 py-2 bg-secondary/20 border border-border rounded-xl text-xs focus:outline-none focus:bg-secondary/30 focus:border-white/10 transition-all font-mono font-bold text-text-main"
                value={selectedElement.startTime}
                onChange={(e) =>
                  handleUpdate({ startTime: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] text-text-muted font-bold ml-1">
                LEN (S)
              </span>
              <input
                type="number"
                step="0.1"
                min="0.1"
                className="w-full px-3 py-2 bg-secondary/20 border border-border rounded-xl text-xs focus:outline-none focus:bg-secondary/30 focus:border-white/10 transition-all font-mono font-bold text-text-main"
                value={selectedElement.duration}
                onChange={(e) =>
                  handleUpdate({ duration: parseFloat(e.target.value) || 0.1 })
                }
              />
            </div>
          </div>
        </div>

        {/* Common: Dimensions */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.15em]">
            Dimensions & Layout
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <span className="text-[10px] text-text-muted font-bold ml-1">
                X POS
              </span>
              <input
                type="number"
                className="w-full px-3 py-2 bg-secondary/20 border border-border rounded-xl text-xs focus:outline-none focus:bg-secondary/30 focus:border-white/10 transition-all font-bold text-text-main"
                value={Math.round(selectedElement.position.x)}
                onChange={(e) =>
                  handleUpdate({
                    position: {
                      ...selectedElement.position,
                      x: parseInt(e.target.value) || 0,
                    },
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] text-text-muted font-bold ml-1">
                Y POS
              </span>
              <input
                type="number"
                className="w-full px-3 py-2 bg-secondary/20 border border-border rounded-xl text-xs focus:outline-none focus:bg-secondary/30 focus:border-white/10 transition-all font-bold text-text-main"
                value={Math.round(selectedElement.position.y)}
                onChange={(e) =>
                  handleUpdate({
                    position: {
                      ...selectedElement.position,
                      y: parseInt(e.target.value) || 0,
                    },
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] text-text-muted font-bold ml-1">
                WIDTH
              </span>
              <input
                type="number"
                className="w-full px-3 py-2 bg-secondary/20 border border-border rounded-xl text-xs focus:outline-none focus:bg-secondary/30 focus:border-white/10 transition-all font-bold text-text-main"
                value={Math.round(selectedElement.size.width)}
                onChange={(e) =>
                  handleUpdate({
                    size: {
                      ...selectedElement.size,
                      width: parseInt(e.target.value) || 20,
                    },
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] text-text-muted font-bold ml-1">
                HEIGHT
              </span>
              <input
                type="number"
                className="w-full px-3 py-2 bg-secondary/20 border border-border rounded-xl text-xs focus:outline-none focus:bg-secondary/30 focus:border-white/10 transition-all font-bold text-text-main"
                value={Math.round(selectedElement.size.height)}
                onChange={(e) =>
                  handleUpdate({
                    size: {
                      ...selectedElement.size,
                      height: parseInt(e.target.value) || 20,
                    },
                  })
                }
              />
            </div>
          </div>
        </div>

        {/* Text Specific properties */}
        {selectedElement.type === "text" && (
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.15em]">
              Text Content & Style
            </label>
            <div className="space-y-3">
              <textarea
                className="w-full px-3 py-2 bg-secondary/20 border border-border rounded-xl text-[13px] focus:outline-none focus:bg-secondary/30 focus:border-white/10 transition-all min-h-[100px] resize-none font-medium leading-relaxed text-text-main"
                placeholder="Enter text here..."
                value={(selectedElement as any).content || ""}
                onChange={(e) => handleUpdate({ content: e.target.value })}
              />
              <div className="flex items-center gap-1 border border-border rounded-xl p-1 bg-secondary/10">
                <button
                  onClick={() => handleUpdate({ textAlign: "left" })}
                  className={cn(
                    "flex-1 py-1.5 flex justify-center hover:bg-white/10 rounded-lg transition-all text-text-muted",
                    (selectedElement as any).textAlign === "left" &&
                      "bg-white/10 text-white",
                  )}
                >
                  <AlignLeft size={14} />
                </button>
                <button
                  onClick={() => handleUpdate({ textAlign: "center" })}
                  className={cn(
                    "flex-1 py-1.5 flex justify-center hover:bg-white/10 rounded-lg transition-all text-text-muted",
                    (selectedElement as any).textAlign === "center" &&
                      "bg-white/10 text-white",
                  )}
                >
                  <AlignCenter size={14} />
                </button>
                <button
                  onClick={() => handleUpdate({ textAlign: "right" })}
                  className={cn(
                    "flex-1 py-1.5 flex justify-center hover:bg-white/10 rounded-lg transition-all text-text-muted",
                    (selectedElement as any).textAlign === "right" &&
                      "bg-white/10 text-white",
                  )}
                >
                  <AlignRight size={14} />
                </button>
              </div>
              <div className="flex items-center gap-3 bg-secondary/10 p-2 rounded-xl border border-border">
                <input
                  type="color"
                  className="w-12 h-8 cursor-pointer rounded-lg border-none p-0 bg-transparent"
                  value={(selectedElement as any).color}
                  onChange={(e) => handleUpdate({ color: e.target.value })}
                />
                <div className="flex-1">
                  <span className="text-[10px] text-text-muted font-bold block uppercase tracking-tighter">
                    Color
                  </span>
                  <span className="text-[11px] font-mono font-bold text-text-main">
                    {(selectedElement as any).color}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Common: Appearance */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.15em]">
            Opacity & Effects
          </label>
          <div className="space-y-3 bg-secondary/10 p-3 rounded-xl border border-border">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-text-muted">
                OPACITY
              </span>
              <span className="text-[11px] font-mono font-bold text-accent">
                {(selectedElement as any).opacity ?? 100}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
              value={(selectedElement as any).opacity ?? 100}
              onChange={(e) =>
                handleUpdate({ opacity: parseInt(e.target.value) })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
