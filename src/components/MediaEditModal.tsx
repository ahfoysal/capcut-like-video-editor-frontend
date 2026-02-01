import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Crop,
  Scissors,
  Check,
  Play,
  Pause,
  RotateCcw,
  Clock,
} from "lucide-react";
import { Element } from "@/types/editor";
import { cn } from "@/lib/utils";

interface MediaEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  element: Element;
  onApply: (updates: Partial<Element>) => void;
}

const getAssetUrl = (url?: string) => {
  if (!url) return "";
  if (
    url.startsWith("http") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  )
    return url;
  return `http://localhost:3001${url.startsWith("/") ? "" : "/"}${url}`;
};

export function MediaEditModal({
  isOpen,
  onClose,
  element,
  onApply,
}: MediaEditModalProps) {
  const [activeTab, setActiveTab] = useState<"crop" | "trim">(
    element.type === "audio" ? "trim" : "crop",
  );

  // Crop State (%)
  const [crop, setCrop] = useState(
    element.crop || { x: 0, y: 0, width: 100, height: 100 },
  );

  // Trim State (s)
  const [trim, setTrim] = useState(
    element.trim || {
      start: 0,
      end: (element as any).naturalDuration || element.duration || 5,
    },
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const [dragState, setDragState] = useState<{
    type: "move" | "nw" | "ne" | "sw" | "se";
    startX: number;
    startY: number;
    initialCrop: typeof crop;
  } | null>(null);

  const srcUrl = (element as any).src ? getAssetUrl((element as any).src) : "";

  useEffect(() => {
    if (isOpen) {
      // Initialize state when modal opens
      setCrop(element.crop || { x: 0, y: 0, width: 100, height: 100 });
      setTrim(
        element.trim || {
          start: 0,
          end: (element as any).naturalDuration || element.duration || 5,
        },
      );
      setActiveTab(element.type === "audio" ? "trim" : "crop");
    }
  }, [isOpen, element]);

  const handleSave = () => {
    const updates: any = {};
    if (element.type !== "audio" && activeTab === "crop") {
      updates.crop = crop;
    }
    if (
      (element.type === "video" || element.type === "audio") &&
      activeTab === "trim"
    ) {
      updates.trim = trim;
      updates.duration = trim.end - trim.start;
    }
    onApply(updates);
    onClose();
  };

  const togglePlayback = () => {
    const media =
      element.type === "video" ? videoRef.current : audioRef.current;
    if (media) {
      if (isPlaying) media.pause();
      else media.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleDragStart = (
    e: React.MouseEvent,
    type: "move" | "nw" | "ne" | "sw" | "se",
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragState({
      type,
      startX: e.clientX,
      startY: e.clientY,
      initialCrop: { ...crop },
    });
  };

  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!previewContainerRef.current) return;

      const rect = previewContainerRef.current.getBoundingClientRect();
      const dx = ((e.clientX - dragState.startX) / rect.width) * 100;
      const dy = ((e.clientY - dragState.startY) / rect.height) * 100;

      let { x, y, width, height } = dragState.initialCrop;
      const MIN_SIZE = 5;

      if (dragState.type === "move") {
        x = Math.max(0, Math.min(100 - width, x + dx));
        y = Math.max(0, Math.min(100 - height, y + dy));
      } else if (dragState.type === "nw") {
        const newX = Math.max(0, Math.min(x + width - MIN_SIZE, x + dx));
        const newY = Math.max(0, Math.min(y + height - MIN_SIZE, y + dy));
        width += x - newX;
        height += y - newY;
        x = newX;
        y = newY;
      } else if (dragState.type === "ne") {
        const newY = Math.max(0, Math.min(y + height - MIN_SIZE, y + dy));
        const newWidth = Math.max(MIN_SIZE, Math.min(100 - x, width + dx));
        height += y - newY;
        y = newY;
        width = newWidth;
      } else if (dragState.type === "sw") {
        const newX = Math.max(0, Math.min(x + width - MIN_SIZE, x + dx));
        const newHeight = Math.max(MIN_SIZE, Math.min(100 - y, height + dy));
        width += x - newX;
        x = newX;
        height = newHeight;
      } else if (dragState.type === "se") {
        width = Math.max(MIN_SIZE, Math.min(100 - x, width + dx));
        height = Math.max(MIN_SIZE, Math.min(100 - y, height + dy));
      }

      setCrop({ x, y, width, height });
    };

    const handleMouseUp = () => setDragState(null);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        onClick={onClose}
      />

      <div className="relative w-full max-w-4xl bg-bg-panel border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between bg-white/5 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center border border-accent/20">
              {element.type === "image" && (
                <Crop className="text-accent w-6 h-6" />
              )}
              {element.type === "video" && (
                <Scissors className="text-accent w-6 h-6" />
              )}
              {element.type === "audio" && (
                <Check className="text-accent w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-main">Edit Media</h3>
              <p className="text-[11px] text-text-muted font-bold uppercase tracking-widest mt-0.5">
                {element.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-text-muted hover:text-text-main"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        {element.type === "video" && (
          <div className="flex px-6 pt-4 gap-4 shrink-0">
            <button
              onClick={() => setActiveTab("crop")}
              className={cn(
                "pb-2 text-xs font-bold uppercase tracking-widest transition-all border-b-2",
                activeTab === "crop"
                  ? "text-accent border-accent"
                  : "text-text-muted border-transparent hover:text-text-main",
              )}
            >
              Spatial Crop
            </button>
            <button
              onClick={() => setActiveTab("trim")}
              className={cn(
                "pb-2 text-xs font-bold uppercase tracking-widest transition-all border-b-2",
                activeTab === "trim"
                  ? "text-accent border-accent"
                  : "text-text-muted border-transparent hover:text-text-main",
              )}
            >
              Time Trim
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row p-6 gap-8 overflow-y-auto">
          {/* Preview */}
          <div className="flex-[2] bg-black/40 rounded-2xl border border-white/5 relative flex items-center justify-center overflow-hidden min-h-[300px]">
            {element.type === "image" && (
              <div className="relative group" ref={previewContainerRef}>
                <img
                  src={srcUrl}
                  alt="Preview"
                  className="max-w-full max-h-[500px] object-contain select-none"
                />
                {activeTab === "crop" && (
                  <div
                    className="absolute border-2 border-accent shadow-[0_0_20px_rgba(34,211,238,0.5)] bg-accent/10 cursor-move"
                    style={{
                      left: `${crop.x}%`,
                      top: `${crop.y}%`,
                      width: `${crop.width}%`,
                      height: `${crop.height}%`,
                    }}
                    onMouseDown={(e) => handleDragStart(e, "move")}
                  >
                    {/* Corner Handles */}
                    <div
                      className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white rounded-full border border-accent cursor-nw-resize"
                      onMouseDown={(e) => handleDragStart(e, "nw")}
                    />
                    <div
                      className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white rounded-full border border-accent cursor-ne-resize"
                      onMouseDown={(e) => handleDragStart(e, "ne")}
                    />
                    <div
                      className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white rounded-full border border-accent cursor-sw-resize"
                      onMouseDown={(e) => handleDragStart(e, "sw")}
                    />
                    <div
                      className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white rounded-full border border-accent cursor-se-resize"
                      onMouseDown={(e) => handleDragStart(e, "se")}
                    />
                  </div>
                )}
              </div>
            )}

            {element.type === "video" && (
              <div
                className="relative w-full h-full flex items-center justify-center"
                ref={previewContainerRef}
              >
                <video
                  ref={videoRef}
                  src={srcUrl}
                  className="max-w-full max-h-[500px] object-contain pointer-events-none"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                {activeTab === "crop" && (
                  <div
                    className="absolute border-2 border-accent shadow-[0_0_20px_rgba(34,211,238,0.5)] bg-accent/10 cursor-move"
                    style={{
                      left: `${crop.x}%`,
                      top: `${crop.y}%`,
                      width: `${crop.width}%`,
                      height: `${crop.height}%`,
                    }}
                    onMouseDown={(e) => handleDragStart(e, "move")}
                  >
                    {/* Corner Handles */}
                    <div
                      className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white rounded-full border border-accent cursor-nw-resize"
                      onMouseDown={(e) => handleDragStart(e, "nw")}
                    />
                    <div
                      className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white rounded-full border border-accent cursor-ne-resize"
                      onMouseDown={(e) => handleDragStart(e, "ne")}
                    />
                    <div
                      className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white rounded-full border border-accent cursor-sw-resize"
                      onMouseDown={(e) => handleDragStart(e, "sw")}
                    />
                    <div
                      className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white rounded-full border border-accent cursor-se-resize"
                      onMouseDown={(e) => handleDragStart(e, "se")}
                    />
                  </div>
                )}
              </div>
            )}

            {element.type === "audio" && (
              <div className="flex flex-col items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20 animate-pulse">
                  <Music className="text-accent w-10 h-10" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-text-main">
                    Audio Track
                  </p>
                  <p className="text-sm text-text-muted">{element.name}</p>
                </div>
                <audio
                  ref={audioRef}
                  src={srcUrl}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              </div>
            )}

            {/* Playback Overlay */}
            {(element.type === "video" || element.type === "audio") && (
              <button
                onClick={togglePlayback}
                className="absolute bottom-6 bg-accent text-black p-4 rounded-full shadow-2xl hover:scale-110 transition-transform active:scale-95 z-10"
              >
                {isPlaying ? (
                  <Pause size={24} fill="currentColor" />
                ) : (
                  <Play size={24} fill="currentColor" />
                )}
              </button>
            )}
          </div>

          {/* Controls Sidebar */}
          <div className="flex-1 space-y-8 bg-white/5 p-6 rounded-2xl border border-white/5">
            {activeTab === "crop" ? (
              <div className="space-y-6">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-accent">
                  Spatial Crop
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase">
                      X Offset (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="w-full bg-secondary/20 border border-border rounded-xl px-3 py-2 text-xs font-bold text-text-main outline-none focus:border-accent/50"
                      value={Math.round(crop.x)}
                      onChange={(e) =>
                        setCrop({
                          ...crop,
                          x: Math.min(
                            100 - crop.width,
                            parseInt(e.target.value) || 0,
                          ),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase">
                      Y Offset (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="w-full bg-secondary/20 border border-border rounded-xl px-3 py-2 text-xs font-bold text-text-main outline-none focus:border-accent/50"
                      value={Math.round(crop.y)}
                      onChange={(e) =>
                        setCrop({
                          ...crop,
                          y: Math.min(
                            100 - crop.height,
                            parseInt(e.target.value) || 0,
                          ),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase">
                      Width (%)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      className="w-full bg-secondary/20 border border-border rounded-xl px-3 py-2 text-xs font-bold text-text-main outline-none focus:border-accent/50"
                      value={Math.round(crop.width)}
                      onChange={(e) =>
                        setCrop({
                          ...crop,
                          width: Math.min(
                            100 - crop.x,
                            parseInt(e.target.value) || 10,
                          ),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase">
                      Height (%)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      className="w-full bg-secondary/20 border border-border rounded-xl px-3 py-2 text-xs font-bold text-text-main outline-none focus:border-accent/50"
                      value={Math.round(crop.height)}
                      onChange={(e) =>
                        setCrop({
                          ...crop,
                          height: Math.min(
                            100 - crop.y,
                            parseInt(e.target.value) || 10,
                          ),
                        })
                      }
                    />
                  </div>
                </div>
                <button
                  onClick={() =>
                    setCrop({ x: 0, y: 0, width: 100, height: 100 })
                  }
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all"
                >
                  <RotateCcw size={14} /> Reset Crop
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-accent">
                  Time Trim
                </h4>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <label className="text-[10px] font-bold text-text-muted uppercase">
                        Start Time
                      </label>
                      <span className="text-xs font-mono font-bold text-accent">
                        {trim.start.toFixed(2)}s
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={(element as any).naturalDuration || 60}
                      step="0.1"
                      className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-accent"
                      value={trim.start}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setTrim({
                          ...trim,
                          start: Math.min(trim.end - 0.1, val),
                        });
                        if (videoRef.current)
                          videoRef.current.currentTime = val;
                        if (audioRef.current)
                          audioRef.current.currentTime = val;
                      }}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <label className="text-[10px] font-bold text-text-muted uppercase">
                        End Time
                      </label>
                      <span className="text-xs font-mono font-bold text-accent">
                        {trim.end.toFixed(2)}s
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={(element as any).naturalDuration || 60}
                      step="0.1"
                      className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-accent"
                      value={trim.end}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setTrim({
                          ...trim,
                          end: Math.max(trim.start + 0.1, val),
                        });
                        if (videoRef.current)
                          videoRef.current.currentTime = val;
                        if (audioRef.current)
                          audioRef.current.currentTime = val;
                      }}
                    />
                  </div>
                </div>
                <div className="p-4 bg-accent/5 border border-accent/20 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-accent" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                      Final Duration
                    </span>
                  </div>
                  <span className="text-lg font-black text-text-main">
                    {(trim.end - trim.start).toFixed(2)}s
                  </span>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
              <button
                onClick={handleSave}
                className="w-full bg-accent text-black h-14 rounded-2xl font-black text-sm transition-all shadow-[0_4px_20px_rgba(34,211,238,0.2)] active:scale-95 flex items-center justify-center gap-2"
              >
                Apply Changes <Check size={18} />
              </button>
              <button
                onClick={onClose}
                className="w-full py-4 text-xs font-bold text-text-muted hover:text-text-main transition-colors uppercase tracking-widest"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const Music = ({ className, size }: { className?: string; size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size || 24}
    height={size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);
