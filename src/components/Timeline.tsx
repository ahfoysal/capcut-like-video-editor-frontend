import React from "react";
import { cn } from "@/lib/utils";
import {
  Play,
  SkipBack,
  SkipForward,
  Pause,
  Plus,
  Minus,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEditorStore } from "@/store/editorStore";

export function Timeline({ className }: { className?: string }) {
  const {
    isPlaying,
    togglePlay,
    timelinePosition,
    setTimelinePosition,
    pages,
    currentPageId,
    selectedElementId,
    setSelectedElement,
    updateElement,
    timelineZoom,
    setTimelineZoom,
  } = useEditorStore();

  const containerRef = React.useRef<HTMLDivElement>(null);
  const PX_PER_SEC = timelineZoom;
  const HEADER_WIDTH = 120;

  const currentPage = pages.find((p) => p.id === currentPageId);
  const elements = currentPage?.elements || [];

  // Calculate project duration based on the last element's end time
  const totalDuration = elements.reduce((max, el) => {
    return Math.max(max, el.startTime + el.duration);
  }, 0);

  // Group elements by type for merged tracks
  const visualElements = elements.filter(
    (el) =>
      el.type === "video" ||
      el.type === "image" ||
      el.type === "shape" ||
      el.type === "qrcode",
  );
  const textElements = elements.filter((el) => el.type === "text");
  const audioElements = elements.filter((el) => el.type === "audio");

  const tracks = [
    {
      label: "Visuals",
      items: visualElements,
      color: "bg-white/10",
      textColor: "text-text-main",
    },
    {
      label: "Text",
      items: textElements,
      color: "bg-accent/10",
      textColor: "text-accent",
    },
    {
      label: "Audio",
      items: audioElements,
      color: "bg-emerald-500/10",
      textColor: "text-emerald-400",
    },
  ];

  const handleScrub = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - HEADER_WIDTH;
    const newPos = Math.max(0, x / PX_PER_SEC);
    setTimelinePosition(newPos);
  };

  const [isScrubbing, setIsScrubbing] = React.useState(false);

  const onRulerMouseDown = (e: React.MouseEvent) => {
    setIsScrubbing(true);
    handleScrub(e);
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isScrubbing) {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left - HEADER_WIDTH;
        const newPos = Math.max(0, x / PX_PER_SEC);
        setTimelinePosition(newPos);
      }
    };
    const handleMouseUp = () => setIsScrubbing(false);

    if (isScrubbing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isScrubbing, setTimelinePosition, PX_PER_SEC]);

  const [timelineDrag, setTimelineDrag] = React.useState<{
    id: string;
    type: "move" | "trim-left" | "trim-right";
    startX: number;
    initialStartTime: number;
    initialDuration: number;
  } | null>(null);

  const onSegmentMouseDown = (
    e: React.MouseEvent,
    element: any,
    type: "move" | "trim-left" | "trim-right",
  ) => {
    e.stopPropagation();
    setSelectedElement(element.id);
    setTimelineDrag({
      id: element.id,
      type,
      startX: e.clientX,
      initialStartTime: element.startTime,
      initialDuration: element.duration,
    });
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (timelineDrag && currentPageId) {
        const dx = (e.clientX - timelineDrag.startX) / PX_PER_SEC;

        if (timelineDrag.type === "move") {
          const newStart = Math.max(0, timelineDrag.initialStartTime + dx);
          updateElement(currentPageId, timelineDrag.id, {
            startTime: newStart,
          });
        } else if (timelineDrag.type === "trim-left") {
          const newStart = Math.max(
            0,
            Math.min(
              timelineDrag.initialStartTime + dx,
              timelineDrag.initialStartTime +
                timelineDrag.initialDuration -
                0.1,
            ),
          );
          const newDuration =
            timelineDrag.initialDuration +
            (timelineDrag.initialStartTime - newStart);
          updateElement(currentPageId, timelineDrag.id, {
            startTime: newStart,
            duration: newDuration,
          });
        } else if (timelineDrag.type === "trim-right") {
          const newDuration = Math.max(0.1, timelineDrag.initialDuration + dx);
          updateElement(currentPageId, timelineDrag.id, {
            duration: newDuration,
          });
        }
      }
    };
    const handleMouseUp = () => setTimelineDrag(null);

    if (timelineDrag) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [timelineDrag, currentPageId, updateElement, PX_PER_SEC]);

  React.useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimelinePosition((prev) => {
          const next = prev + 0.1;
          if (next >= totalDuration) {
            if (isPlaying) togglePlay();
            return totalDuration;
          }
          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, totalDuration, togglePlay, setTimelinePosition]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}:${ms}0`;
  };

  return (
    <div
      className={cn("bg-bg-panel flex flex-col h-full select-none", className)}
    >
      {/* Timeline Controls */}
      <div className="h-14 border-y border-border flex items-center px-4 justify-between bg-bg-app/50 relative z-50">
        <div className="flex items-center gap-6">
          <div className="text-[13px] font-mono font-bold text-accent tabular-nums tracking-wider bg-black/40 px-3 py-1 rounded-md border border-white/5">
            {formatTime(timelinePosition)}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTimelinePosition(0)}
              title="Skip to Beginning"
              className="p-2 hover:bg-white/5 rounded-full transition-colors text-text-muted hover:text-text-main"
            >
              <SkipBack size={18} />
            </button>
            <button
              onClick={() =>
                setTimelinePosition(Math.max(0, timelinePosition - 1))
              }
              title="Jump Back (1s)"
              className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-text-muted/50 hover:text-text-main"
            >
              <Minus size={14} />
            </button>
            <button
              onClick={togglePlay}
              className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:bg-gray-200 transition-all active:scale-95 shadow-lg"
            >
              {isPlaying ? (
                <Pause size={18} fill="currentColor" />
              ) : (
                <Play size={18} fill="currentColor" className="ml-1" />
              )}
            </button>
            <button
              onClick={() => setTimelinePosition(timelinePosition + 1)}
              title="Jump Forward (1s)"
              className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-text-muted/50 hover:text-text-main"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={() => setTimelinePosition(totalDuration)}
              title="Skip to End"
              className="p-2 hover:bg-white/5 rounded-full transition-colors text-text-muted hover:text-text-main"
            >
              <SkipForward size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 border-l border-border pl-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTimelineZoom(timelineZoom - 10)}
              className="p-1.5 hover:bg-white/10 rounded-md transition-all text-text-muted hover:text-text-main"
            >
              <ZoomOut size={16} />
            </button>
            <div className="w-32 h-1 bg-white/5 rounded-full relative overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full bg-accent rounded-full shadow-[0_0_8px_rgba(34,211,238,0.5)] transition-all duration-300"
                style={{ width: `${(timelineZoom / 200) * 100}%` }}
              />
            </div>
            <button
              onClick={() => setTimelineZoom(timelineZoom + 10)}
              className="p-1.5 hover:bg-white/10 rounded-md transition-all text-text-muted hover:text-text-main"
            >
              <ZoomIn size={16} />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 flex flex-col overflow-hidden relative bg-[#111114]"
      >
        {/* Time Ruler */}
        <div
          className="h-8 border-b border-border bg-bg-panel flex items-center relative z-30 cursor-crosshair ml-30"
          onMouseDown={onRulerMouseDown}
        >
          <div className="flex w-1250">
            {Array.from({ length: Math.ceil(totalDuration) + 10 }).map(
              (_, i) => (
                <div
                  key={i}
                  className="border-l border-border/50 h-3 flex items-end pb-1 px-1 shrink-0"
                  style={{ width: PX_PER_SEC }}
                >
                  <span className="text-[9px] font-bold text-text-muted/60 font-mono">
                    {i}s
                  </span>
                </div>
              ),
            )}
          </div>
        </div>

        {/* Tracks Area */}
        <div className="flex-1 overflow-x-auto overflow-y-auto no-scrollbar relative z-10 transition-all">
          <div className="flex flex-col min-w-1250">
            {tracks.map((track) => {
              // Group items into non-overlapping rows
              const sorted = [...track.items].sort(
                (a, b) => a.startTime - b.startTime,
              );
              const rows: any[][] = [];
              sorted.forEach((el) => {
                let placed = false;
                for (const row of rows) {
                  const last = row[row.length - 1];
                  const gap = 0.05; // small gap
                  if (el.startTime >= last.startTime + last.duration + gap) {
                    row.push(el);
                    placed = true;
                    break;
                  }
                }
                if (!placed) {
                  rows.push([el]);
                }
              });

              // Ensure at least one row if track exists? No, just rows.
              const rowCount = rows.length || 1;
              const rowHeight = 40;
              const totalHeight = rowCount * rowHeight + 12; // padding

              return (
                <div
                  key={track.label}
                  className="grid grid-cols-[120px_1fr] border-b border-border/10 group overflow-hidden"
                  style={{ minHeight: totalHeight }}
                >
                  <div className="sticky left-0 bg-bg-panel z-20 px-4 flex items-center border-r border-border/20 text-[10px] font-bold text-text-muted uppercase tracking-wider group-hover:text-text-main transition-colors">
                    {track.label}
                  </div>
                  <div className="relative h-full py-1.5 bg-black/5">
                    {rows.map((row, rowIndex) => (
                      <React.Fragment key={rowIndex}>
                        {row.map((element) => (
                          <div
                            key={element.id}
                            onMouseDown={(e) =>
                              onSegmentMouseDown(e, element, "move")
                            }
                            className={cn(
                              "absolute h-9 rounded-md border flex items-center px-3 cursor-move transition-shadow z-10",
                              track.color,
                              selectedElementId === element.id
                                ? "ring-2 ring-white border-transparent z-20 shadow-2xl scale-[1.01]"
                                : "border-white/10 hover:border-white/30",
                            )}
                            style={{
                              left: element.startTime * PX_PER_SEC,
                              width: element.duration * PX_PER_SEC,
                              top: rowIndex * rowHeight + 6,
                            }}
                          >
                            <span
                              className={cn(
                                "text-[11px] font-bold truncate",
                                track.textColor,
                              )}
                            >
                              {element.name || element.type}
                            </span>

                            {/* Trimming handles */}
                            {selectedElementId === element.id && (
                              <>
                                <div
                                  className="absolute left-0 top-0 bottom-0 w-2 hover:bg-white/50 bg-white/30 rounded-l-md cursor-ew-resize transition-colors"
                                  onMouseDown={(e) =>
                                    onSegmentMouseDown(e, element, "trim-left")
                                  }
                                />
                                <div
                                  className="absolute right-0 top-0 bottom-0 w-2 hover:bg-white/50 bg-white/30 rounded-r-md cursor-ew-resize transition-colors"
                                  onMouseDown={(e) =>
                                    onSegmentMouseDown(e, element, "trim-right")
                                  }
                                />
                              </>
                            )}
                          </div>
                        ))}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white z-40 pointer-events-none transition-none shadow-[0_0_8px_rgba(255,255,255,0.5)]"
          style={{ left: HEADER_WIDTH + timelinePosition * PX_PER_SEC }}
        >
          <div className="w-3 h-3 bg-white rounded-xs rotate-45 -translate-x-1/2 -mt-1.5 shadow-lg border border-black/20" />
        </div>
      </div>
    </div>
  );
}
