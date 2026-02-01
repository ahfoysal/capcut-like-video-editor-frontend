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
  Volume2,
  Trash2,
  Scissors,
  Clock,
  Plus,
  Minus,
  Maximize2,
  Crop,
  Activity,
  ArrowLeftRight,
  Move,
  RefreshCw,
  Radio,
} from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { Element } from "@/types/editor";
import { cn } from "@/lib/utils";
import { getCellBoundaries } from "@/lib/gridLayouts";
import { MediaEditModal } from "./MediaEditModal";

const getLayoutDimensions = (layout: string = "16:9") => {
  switch (layout) {
    case "1:1":
      return { width: 1080, height: 1080 };
    case "16:9":
      return { width: 1920, height: 1080 };
    case "9:16":
      return { width: 1080, height: 1920 };
    case "4:5":
      return { width: 1080, height: 1350 };
    case "2:3":
      return { width: 1080, height: 1620 };
    default:
      return { width: 1920, height: 1080 };
  }
};

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
    if (!currentPage || !selectedElement) return;

    // Get all current layers
    const layers = currentPage.elements.map((el) => (el as any).layer ?? 0);

    if (direction === "front") {
      // Move to front: find max layer and add 1
      const maxLayer = Math.max(...layers, 0);
      handleUpdate({ layer: maxLayer + 1 } as any);
    } else {
      // Send to back: find min layer and subtract 1
      const minLayer = Math.min(...layers, 0);
      handleUpdate({ layer: minLayer - 1 } as any);
    }
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

  const [isMediaModalOpen, setIsMediaModalOpen] = React.useState(false);

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

          {(selectedElement.type === "image" ||
            selectedElement.type === "video" ||
            selectedElement.type === "audio") && (
            <button
              onClick={() => setIsMediaModalOpen(true)}
              className="col-span-2 flex items-center justify-center gap-2 w-full py-2.5 bg-accent/20 border border-accent/30 text-accent text-xs font-bold rounded-xl hover:bg-accent/30 transition-all active:scale-95"
            >
              <Crop size={14} />
              Crop / Trim Media
            </button>
          )}
        </div>

        {/* Image/Video: Fit to Full Canvas or Cell */}
        {(selectedElement.type === "image" ||
          selectedElement.type === "video") && (
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.15em]">
              {currentPage?.gridMode && selectedElement.gridCell
                ? "Fit to Cell"
                : "Full Canvas"}
            </label>
            <div className="flex items-center gap-1 border border-border rounded-xl p-1 bg-secondary/10">
              <button
                onClick={() => {
                  let targetPos = { x: 0, y: 0 };
                  let targetSize = getLayoutDimensions(
                    currentPage?.layout || "16:9",
                  );

                  if (
                    currentPage?.gridMode &&
                    currentPage?.gridLayout &&
                    selectedElement.gridCell
                  ) {
                    const cell = currentPage.gridLayout.cells.find(
                      (c) => c.id === selectedElement.gridCell?.cellId,
                    );
                    if (cell) {
                      const bounds = getCellBoundaries(
                        cell,
                        targetSize.width,
                        targetSize.height,
                        currentPage.gridLayout,
                      );
                      targetPos = { x: bounds.x, y: bounds.y };
                      targetSize = {
                        width: bounds.width,
                        height: bounds.height,
                      };
                    }
                  }

                  handleUpdate({
                    fill: "fill",
                    position: targetPos,
                    size: targetSize,
                  } as any);
                }}
                title="Fill frame – covers area, may crop"
                className={cn(
                  "flex-1 py-2 flex flex-col items-center gap-0.5 hover:bg-white/10 rounded-lg transition-all text-text-muted",
                  (selectedElement as any).fill === "fill" &&
                    "bg-white/10 text-accent",
                )}
              >
                <Crop size={14} />
                <span className="text-[9px] font-bold">Fill</span>
              </button>
              <button
                onClick={() => {
                  let targetPos = { x: 0, y: 0 };
                  let targetSize = getLayoutDimensions(
                    currentPage?.layout || "16:9",
                  );

                  if (
                    currentPage?.gridMode &&
                    currentPage?.gridLayout &&
                    selectedElement.gridCell
                  ) {
                    const cell = currentPage.gridLayout.cells.find(
                      (c) => c.id === selectedElement.gridCell?.cellId,
                    );
                    if (cell) {
                      const bounds = getCellBoundaries(
                        cell,
                        targetSize.width,
                        targetSize.height,
                        currentPage.gridLayout,
                      );
                      targetPos = { x: bounds.x, y: bounds.y };
                      targetSize = {
                        width: bounds.width,
                        height: bounds.height,
                      };
                    }
                  }

                  handleUpdate({
                    fill: "fit",
                    position: targetPos,
                    size: targetSize,
                  } as any);
                }}
                title="Fit frame – entire media visible"
                className={cn(
                  "flex-1 py-2 flex flex-col items-center gap-0.5 hover:bg-white/10 rounded-lg transition-all text-text-muted",
                  ((selectedElement as any).fill === "fit" ||
                    !(selectedElement as any).fill) &&
                    "bg-white/10 text-accent",
                )}
              >
                <Maximize2 size={14} />
                <span className="text-[9px] font-bold">Fit</span>
              </button>
              <button
                onClick={() => {
                  const targetSize = getLayoutDimensions(
                    currentPage?.layout || "16:9",
                  );
                  let targetPos = { x: 0, y: 0 };
                  let targetSizeVal = {
                    width: targetSize.width,
                    height: targetSize.height,
                  };

                  if (
                    currentPage?.gridMode &&
                    currentPage?.gridLayout &&
                    selectedElement.gridCell
                  ) {
                    const cell = currentPage.gridLayout.cells.find(
                      (c) => c.id === selectedElement.gridCell?.cellId,
                    );
                    if (cell) {
                      const bounds = getCellBoundaries(
                        cell,
                        targetSizeVal.width,
                        targetSizeVal.height,
                        currentPage.gridLayout,
                      );
                      targetPos = { x: bounds.x, y: bounds.y };
                      targetSizeVal = {
                        width: bounds.width,
                        height: bounds.height,
                      };
                    }
                  }

                  handleUpdate({
                    fill: "stretch",
                    position: targetPos,
                    size: targetSizeVal,
                  } as any);
                }}
                title="Stretch frame – fills area, may distort"
                className={cn(
                  "flex-1 py-2 flex flex-col items-center gap-0.5 hover:bg-white/10 rounded-lg transition-all text-text-muted",
                  (selectedElement as any).fill === "stretch" &&
                    "bg-white/10 text-accent",
                )}
              >
                <Move size={14} />
                <span className="text-[9px] font-bold">Stretch</span>
              </button>
            </div>

            {/* Content Fitting Controls */}
            <div className="flex gap-2 p-1 bg-black/20 rounded-lg border border-white/5">
              <button
                onClick={() => {
                  const el = selectedElement as any;
                  if (el.naturalWidth && el.naturalHeight) {
                    const ratio = el.naturalWidth / el.naturalHeight;
                    const newHeight = selectedElement.size.width / ratio;
                    handleUpdate({
                      size: {
                        ...selectedElement.size,
                        height: newHeight,
                      },
                      fill: "fit", // Automatically switch to fit for better behavior
                    } as any);
                  }
                }}
                disabled={
                  !(selectedElement as any).naturalWidth ||
                  !(selectedElement as any).naturalHeight
                }
                title="Fit frame to content aspect ratio"
                className="flex-1 py-2 flex flex-col items-center gap-0.5 hover:bg-white/10 rounded-lg transition-all text-text-muted disabled:opacity-30"
              >
                <Maximize2 size={14} />
                <span className="text-[9px] font-bold">Fit Frame</span>
              </button>

              <button
                onClick={() => {
                  const el = selectedElement as any;
                  if (el.naturalWidth && el.naturalHeight) {
                    handleUpdate({
                      size: {
                        width: el.naturalWidth,
                        height: el.naturalHeight,
                      },
                      fill: "fit",
                    } as any);
                  }
                }}
                disabled={
                  !(selectedElement as any).naturalWidth ||
                  !(selectedElement as any).naturalHeight
                }
                title="Reset to natural size"
                className="flex-1 py-2 flex flex-col items-center gap-0.5 hover:bg-white/10 rounded-lg transition-all text-text-muted disabled:opacity-30"
              >
                <RefreshCw size={14} />
                <span className="text-[9px] font-bold">Natural</span>
              </button>
            </div>
          </div>
        )}

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
              <div className="space-y-3 bg-secondary/10 p-3 rounded-xl border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">
                    Font Family
                  </span>
                  <select
                    className="bg-transparent border-none text-[11px] font-bold text-accent outline-none cursor-pointer"
                    value={(selectedElement as any).fontFamily || "Inter"}
                    onChange={(e) =>
                      handleUpdate({ fontFamily: e.target.value })
                    }
                  >
                    <option value="Inter">Inter (Sans)</option>
                    <option value="Roboto">Roboto (Sans)</option>
                    <option value="Montserrat">Montserrat</option>
                    <option value="Oswald">Oswald (Display)</option>
                    <option value="Playfair Display">Playfair Display</option>
                    <option value="Ubuntu">Ubuntu</option>
                    <option value="Lato">Lato</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 bg-secondary/10 p-3 rounded-xl border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">
                    Font Size
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      className="w-12 bg-transparent border-none text-[11px] font-mono font-bold text-accent text-right outline-none"
                      value={(selectedElement as any).fontSize || 32}
                      onChange={(e) => {
                        const newSize = parseInt(e.target.value) || 12;
                        const updates: any = { fontSize: newSize };
                        if (newSize * 1.4 > selectedElement.size.height) {
                          updates.size = {
                            ...selectedElement.size,
                            height: Math.ceil(newSize * 1.4),
                          };
                        }
                        handleUpdate(updates);
                      }}
                    />
                    <span className="text-[10px] text-text-muted">PX</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="8"
                  max="200"
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                  value={(selectedElement as any).fontSize || 32}
                  onChange={(e) => {
                    const newSize = parseInt(e.target.value);
                    const updates: any = { fontSize: newSize };
                    if (newSize * 1.4 > selectedElement.size.height) {
                      updates.size = {
                        ...selectedElement.size,
                        height: Math.ceil(newSize * 1.4),
                      };
                    }
                    handleUpdate(updates);
                  }}
                />
              </div>
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
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 bg-secondary/10 p-2 rounded-xl border border-border">
                  <input
                    type="color"
                    className="w-10 h-8 cursor-pointer rounded-lg border-none p-0 bg-transparent"
                    value={(selectedElement as any).color || "#ffffff"}
                    onChange={(e) => handleUpdate({ color: e.target.value })}
                  />
                  <div className="flex-1 overflow-hidden">
                    <span className="text-[9px] text-text-muted font-bold block uppercase tracking-tighter">
                      Text
                    </span>
                    <span className="text-[10px] font-mono font-bold text-text-main truncate block">
                      {(selectedElement as any).color || "#FFFFFF"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-secondary/10 p-2 rounded-xl border border-border">
                  <input
                    type="color"
                    className="w-10 h-8 cursor-pointer rounded-lg border-none p-0 bg-transparent"
                    value={
                      (selectedElement as any).backgroundColor || "#000000"
                    }
                    onChange={(e) =>
                      handleUpdate({ backgroundColor: e.target.value })
                    }
                  />
                  <div className="flex-1 overflow-hidden">
                    <span className="text-[9px] text-text-muted font-bold block uppercase tracking-tighter">
                      BG
                    </span>
                    <span className="text-[10px] font-mono font-bold text-text-main truncate block">
                      {(selectedElement as any).backgroundColor || "None"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stroke Controls */}
              <div className="space-y-3 bg-secondary/10 p-3 rounded-xl border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">
                    Text Stroke / Outline
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="10"
                      className="w-8 bg-transparent border-none text-[11px] font-mono font-bold text-accent text-right outline-none"
                      value={(selectedElement as any).strokeWidth || 0}
                      onChange={(e) =>
                        handleUpdate({
                          strokeWidth: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                    <span className="text-[10px] text-text-muted">PX</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="color"
                    className="w-10 h-8 cursor-pointer rounded-lg border-none p-0 bg-transparent"
                    value={(selectedElement as any).strokeColor || "#000000"}
                    onChange={(e) =>
                      handleUpdate({ strokeColor: e.target.value })
                    }
                  />
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                    value={(selectedElement as any).strokeWidth || 0}
                    onChange={(e) =>
                      handleUpdate({ strokeWidth: parseFloat(e.target.value) })
                    }
                  />
                </div>
              </div>

              {/* Border Radius for Background */}
              {(selectedElement as any).backgroundColor &&
                (selectedElement as any).backgroundColor !== "transparent" && (
                  <div className="space-y-3 bg-secondary/10 p-3 rounded-xl border border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">
                        BG Corner Radius
                      </span>
                      <span className="text-[10px] font-mono font-bold text-accent">
                        {(selectedElement as any).borderRadius || 0}PX
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                      value={parseInt(
                        (selectedElement as any).borderRadius || "0",
                      )}
                      onChange={(e) =>
                        handleUpdate({ borderRadius: `${e.target.value}px` })
                      }
                    />
                  </div>
                )}

              {/* Marquee Controls */}
              <div className="space-y-3 bg-secondary/10 p-3 rounded-xl border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleUpdate({
                          marquee: !(selectedElement as any).marquee,
                        })
                      }
                      className={cn(
                        "p-1.5 rounded-lg transition-all",
                        (selectedElement as any).marquee
                          ? "bg-accent text-white shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                          : "bg-white/10 text-text-muted",
                      )}
                    >
                      <Activity size={14} />
                    </button>
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">
                      Headline Marquee
                    </span>
                  </div>

                  {/* TV Ticker Preset Button */}
                  <button
                    onClick={() => {
                      const layoutDim = getLayoutDimensions(
                        currentPage?.layout || "16:9",
                      );
                      handleUpdate({
                        marquee: true,
                        marqueeSpeed: 12,
                        marqueeDirection: "left",
                        backgroundColor: "#cc0000",
                        color: "#ffffff",
                        fontSize: 28,
                        fontWeight: "bold",
                        fontFamily: "Montserrat",
                        textAlign: "left",
                        size: { width: layoutDim.width, height: 64 },
                        position: { x: 0, y: layoutDim.height - 64 },
                        borderRadius: "0px",
                        strokeWidth: 0,
                      });
                    }}
                    className="flex items-center gap-1.5 px-2 py-1 bg-accent/20 hover:bg-accent/30 text-accent text-[9px] font-bold rounded-lg border border-accent/30 transition-all uppercase"
                  >
                    <Radio size={10} />
                    TV Ticker Preset
                  </button>
                </div>

                {(selectedElement as any).marquee && (
                  <div className="space-y-3 pt-1 animate-fade-in">
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-[10px] text-text-muted font-bold">
                          ANIMATION SPEED
                        </span>
                        <span className="text-[10px] font-mono font-bold text-accent">
                          {(selectedElement as any).marqueeSpeed || 10}S
                        </span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="60"
                        step="1"
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                        value={(selectedElement as any).marqueeSpeed || 10}
                        onChange={(e) =>
                          handleUpdate({
                            marqueeSpeed: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="flex gap-1 p-1 bg-black/20 rounded-lg">
                      <button
                        onClick={() =>
                          handleUpdate({ marqueeDirection: "left" })
                        }
                        className={cn(
                          "flex-1 py-1 text-[9px] font-bold rounded-md transition-all",
                          (selectedElement as any).marqueeDirection !== "right"
                            ? "bg-white/10 text-white"
                            : "text-text-muted hover:text-white",
                        )}
                      >
                        LEFT
                      </button>
                      <button
                        onClick={() =>
                          handleUpdate({ marqueeDirection: "right" })
                        }
                        className={cn(
                          "flex-1 py-1 text-[9px] font-bold rounded-md transition-all",
                          (selectedElement as any).marqueeDirection === "right"
                            ? "bg-white/10 text-white"
                            : "text-text-muted hover:text-white",
                        )}
                      >
                        RIGHT
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        const layoutDim = getLayoutDimensions(
                          currentPage?.layout || "16:9",
                        );
                        handleUpdate({
                          position: { ...selectedElement.position, x: 0 },
                          size: {
                            ...selectedElement.size,
                            width: layoutDim.width,
                          },
                        });
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white rounded-lg border border-white/10 transition-all group"
                    >
                      <ArrowLeftRight
                        size={12}
                        className="text-accent group-hover:scale-110 transition-transform"
                      />
                      FIT TO FULL WIDTH
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Audio: Sound Control */}
        {selectedElement.type === "audio" && (
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.15em]">
              Sound
            </label>
            <div className="space-y-3 bg-secondary/10 p-3 rounded-xl border border-border">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-text-muted flex items-center gap-2">
                  <Volume2 size={14} />
                  VOLUME
                </span>
                <span className="text-[11px] font-mono font-bold text-accent">
                  {(selectedElement as any).volume ?? 100}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                value={(selectedElement as any).volume ?? 100}
                onChange={(e) =>
                  handleUpdate({ volume: parseInt(e.target.value) })
                }
              />
            </div>
          </div>
        )}

        {/* Common: Appearance (not for audio) */}
        {selectedElement.type !== "audio" && (
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
        )}
      </div>

      <MediaEditModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        element={selectedElement}
        onApply={handleUpdate}
      />
    </div>
  );
}
