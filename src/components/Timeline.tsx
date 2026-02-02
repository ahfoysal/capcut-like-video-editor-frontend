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
  Copy,
  Maximize,
  Minimize,
  PanelBottomOpen,
  PanelBottom,
  StretchVertical,
} from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { resumeAudioContextOnGesture } from "@/lib/audioContext";

const generateElementId = () => `el-${Math.random().toString(36).substr(2, 9)}`;

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
    addElement,
    timelineZoom,
    setTimelineZoom,
    addPage,
    deletePage,
    updatePage,
    setCurrentPage,
    moveElementToPage,
    duplicatePage,
    reorderPages,
    isFullscreen,
    toggleFullscreen,
    timelineHeightMode,
    setTimelineHeightMode,
    setTimelineHeight,
    isTimelineResizing,
    setIsTimelineResizing,
  } = useEditorStore();

  const [editingPageId, setEditingPageId] = React.useState<string | null>(null);
  const [editingPageValue, setEditingPageValue] = React.useState("");

  const startResizing = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsTimelineResizing(true);
      document.body.style.cursor = "ns-resize";
    },
    [setIsTimelineResizing],
  );

  const stopResizing = React.useCallback(() => {
    setIsTimelineResizing(false);
    document.body.style.cursor = "";
  }, [setIsTimelineResizing]);

  const resize = React.useCallback(
    (e: MouseEvent) => {
      if (isTimelineResizing) {
        const newHeight = window.innerHeight - e.clientY;
        // Limit height between 56 and 800
        if (newHeight >= 56 && newHeight < 800) {
          setTimelineHeight(newHeight);
          if (timelineHeightMode !== "default") {
            setTimelineHeightMode("default");
          }
        }
      }
    },
    [
      isTimelineResizing,
      setTimelineHeight,
      timelineHeightMode,
      setTimelineHeightMode,
    ],
  );

  React.useEffect(() => {
    if (isTimelineResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    } else {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isTimelineResizing, resize, stopResizing]);

  const handleRenameSubmit = (pageId: string) => {
    if (editingPageValue.trim()) {
      updatePage(pageId, { name: editingPageValue.trim() });
    }
    setEditingPageId(null);
  };

  const containerRef = React.useRef<HTMLDivElement>(null);
  const PX_PER_SEC = timelineZoom;
  const HEADER_WIDTH = 120;

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

  const getMediaDuration = (
    url: string,
    type: "video" | "audio",
  ): Promise<number> =>
    new Promise((resolve) => {
      const media = document.createElement(type);
      media.crossOrigin = "anonymous";
      media.src = url;
      const timeout = setTimeout(() => resolve(5), 2000);
      media.onloadedmetadata = () => {
        clearTimeout(timeout);
        resolve(media.duration || 5);
      };
      media.onerror = () => {
        clearTimeout(timeout);
        resolve(5);
      };
    });

  const currentPage = pages.find((p) => p.id === currentPageId);
  const elements = currentPage?.elements || [];

  // Calculate project duration based on the last element's end time
  const projectDuration = elements.reduce((max, el) => {
    return Math.max(max, el.startTime + el.duration);
  }, 0);

  // Buffer duration for the timeline
  const totalDuration = Math.max(projectDuration + 2, 10); // Small buffer, min 10s

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

  // Dynamic Scale Logic
  const getScaleConfig = () => {
    const pixelsPerSec = PX_PER_SEC;
    const minSpacing = 80; // Minimum pixels between major labels

    // "Nice" intervals for time (in seconds)
    const candidates = [
      0.1, 0.2, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 1200, 3600,
    ];

    // Find the smallest candidate that results in spacing >= minSpacing
    let major = candidates[candidates.length - 1];
    for (const c of candidates) {
      if (c * pixelsPerSec >= minSpacing) {
        major = c;
        break;
      }
    }

    // Determine minor interval based on major
    let minor = major / 5;
    if (major === 0.2) minor = 0.1;
    if (major === 0.5) minor = 0.1;
    if (major === 2) minor = 0.5;
    if (major === 15) minor = 5;
    if (major === 30) minor = 10;
    if (major === 60) minor = 15;
    if (major >= 120) minor = 60;

    return {
      major,
      minor,
      label: (i: number) => {
        if (i === 0) return "0s";
        if (i < 60) return `${i}s`;
        const mins = Math.floor(i / 60);
        const secs = i % 60;
        return secs === 0 ? `${mins}m` : `${mins}m ${secs}s`;
      },
    };
  };

  const scaleConfig = getScaleConfig();

  // Wall-clock playback ref — must be declared before handleScrub so we can update it on seek
  const playbackStartRef = React.useRef<{
    time: number;
    position: number;
  } | null>(null);

  const handleScrub = React.useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (!containerRef.current || !tracksScrollRef.current) return;
      const scrollEl = tracksScrollRef.current;
      const rect = scrollEl.getBoundingClientRect();

      const scrollLeft = scrollEl.scrollLeft;
      const clickX = e.clientX - rect.left + scrollLeft - HEADER_WIDTH;

      const newPos = Math.max(0, clickX / PX_PER_SEC);
      setTimelinePosition(newPos);

      // When seeking during playback, update playback start so playhead stays where user clicked
      if (useEditorStore.getState().isPlaying) {
        playbackStartRef.current = {
          time: performance.now(),
          position: newPos,
        };
      }
    },
    [PX_PER_SEC, setTimelinePosition],
  );

  const [isScrubbing, setIsScrubbing] = React.useState(false);

  const onTracksMouseDown = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    setSelectedElement(null);
  };
  const onRulerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsScrubbing(true);
    handleScrub(e);
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isScrubbing) {
        handleScrub(e);
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
  }, [isScrubbing, handleScrub]);

  const tracksScrollRef = React.useRef<HTMLDivElement>(null);

  const handleTimelineDrop = React.useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        const raw = e.dataTransfer.getData("application/json");
        if (!raw) return;
        const asset = JSON.parse(raw);
        if (!currentPageId) return;

        const scrollEl = tracksScrollRef.current;
        if (!scrollEl) return;
        const rect = scrollEl.getBoundingClientRect();
        const scrollLeft = scrollEl.scrollLeft;
        const dropX = e.clientX - rect.left + scrollLeft - HEADER_WIDTH;
        const startTime = Math.max(0, dropX / PX_PER_SEC);

        const assetSrc = getAssetUrl(asset.url || asset.src);
        let duration = 5;
        if (asset.type === "video" || asset.type === "audio") {
          duration = await getMediaDuration(assetSrc, asset.type);
        } else if (asset.type === "image") {
          duration = 10;
        }

        const id = generateElementId();
        const newElement: any = {
          id,
          type: asset.type,
          name: asset.name || asset.label,
          position: { x: 100, y: 100 },
          size: { width: 200, height: 150 },
          duration,
          startTime,
          freePosition: true,
          opacity: 100,
          layer: (currentPage?.elements.length || 0) + 1,
        };

        const elements = currentPage?.elements || [];
        const hasVisuals = elements.some(
          (el) => el.type === "image" || el.type === "video",
        );
        const defaultFill = hasVisuals ? "fill" : "fit";

        if (asset.type === "image") {
          newElement.src = asset.url || asset.src;
          newElement.fill = defaultFill;
          newElement.size = { width: 400, height: 300 };
        } else if (asset.type === "video") {
          newElement.src = asset.url || asset.src;
          newElement.thumbnail = asset.thumbnail;
          newElement.volume = 75;
          newElement.fill = defaultFill;
          newElement.size = { width: 320, height: 180 };
          newElement.naturalDuration = duration;
        } else if (asset.type === "shape") {
          newElement.shapeType = asset.name;
          newElement.color = asset.color || "#3b82f6";
          newElement.size = { width: 100, height: 100 };
        } else if (asset.type === "text") {
          const fs = asset.fontSize || 32;
          newElement.content = asset.content || "Double click to edit";
          newElement.fontSize = fs;
          newElement.fontWeight = asset.fontWeight || "bold";
          newElement.color = asset.color || "#ffffff";
          newElement.backgroundColor = asset.backgroundColor || "transparent";
          newElement.size = { width: 400, height: Math.max(60, fs * 1.4) };
        } else if (asset.type === "audio") {
          newElement.src = asset.url || asset.src;
          newElement.volume = 100;
          newElement.size = { width: 150, height: 60 };
          newElement.naturalDuration = duration;
        }

        addElement(currentPageId, newElement);
      } catch (err) {
        console.error("Timeline drop failed:", err);
      }
    },
    [currentPageId, addElement, PX_PER_SEC, currentPage?.elements],
  );

  // Auto-scroll to playhead during playback
  React.useEffect(() => {
    if (isPlaying && tracksScrollRef.current) {
      const scrollEl = tracksScrollRef.current;
      const playheadX = timelinePosition * PX_PER_SEC;
      const viewWidth = scrollEl.clientWidth - HEADER_WIDTH;
      const currentScroll = scrollEl.scrollLeft;

      if (playheadX > currentScroll + viewWidth - 100) {
        const targetScroll = playheadX - viewWidth + 200;
        scrollEl.scrollTo({ left: targetScroll, behavior: "auto" });
      } else if (playheadX < currentScroll) {
        const targetScroll = Math.max(0, playheadX - 100);
        scrollEl.scrollTo({ left: targetScroll, behavior: "auto" });
      }
    }
  }, [isPlaying, timelinePosition, PX_PER_SEC]);

  // Track last auto-zoomed duration to avoid interfering with manual zoom
  const lastAutoZoomedDuration = React.useRef(0);

  // Auto-adjust zoom when project duration changes significantly
  React.useEffect(() => {
    if (projectDuration > 0 && tracksScrollRef.current) {
      // Only auto-zoom if duration changed significantly (more than 1 second)
      if (Math.abs(projectDuration - lastAutoZoomedDuration.current) > 1) {
        const viewWidth = tracksScrollRef.current.clientWidth - HEADER_WIDTH;

        // Target: fit the entire duration in 90% of the viewport
        const targetZoom = (viewWidth * 0.9) / projectDuration;

        // Only set upper limit, allow very small zooms for long videos
        const clampedZoom = Math.min(200, targetZoom);

        setTimelineZoom(clampedZoom);
        lastAutoZoomedDuration.current = projectDuration;
      }
    }
  }, [projectDuration, setTimelineZoom]); // Removed timelineZoom from dependencies

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

          // Auto-scroll when dragging near edges
          if (tracksScrollRef.current) {
            const scrollEl = tracksScrollRef.current;
            const rect = scrollEl.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            if (mouseX > scrollEl.clientWidth - 50) {
              scrollEl.scrollTo({
                left: scrollEl.scrollLeft + 10,
                behavior: "auto",
              });
            } else if (mouseX < HEADER_WIDTH + 50) {
              scrollEl.scrollTo({
                left: scrollEl.scrollLeft - 10,
                behavior: "auto",
              });
            }
          }
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

  // Sync playback start when play is pressed
  React.useEffect(() => {
    if (isPlaying) {
      playbackStartRef.current = {
        time: performance.now(),
        position: useEditorStore.getState().timelinePosition,
      };
    } else {
      playbackStartRef.current = null;
    }
  }, [isPlaying]);

  // Throttle React updates so audio isn't hammered by 60fps re-renders
  const lastSetTimeRef = React.useRef(0);
  const THROTTLE_MS = 50; // ~20fps for UI; ref updated every frame for smoother playback

  React.useEffect(() => {
    let animationFrame: number;
    const store = useEditorStore.getState();

    const animate = () => {
      const start = playbackStartRef.current;
      if (!start) return;

      const elapsed = (performance.now() - start.time) / 1000;
      const next = start.position + elapsed;

      store.playbackTimeRef.current = next;

      if (next >= projectDuration) {
        setTimelinePosition(projectDuration);
        togglePlay();
        return;
      }
      const now = performance.now();
      if (now - lastSetTimeRef.current >= THROTTLE_MS) {
        lastSetTimeRef.current = now;
        setTimelinePosition(next);
      }
      animationFrame = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      animationFrame = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [isPlaying, projectDuration, togglePlay, setTimelinePosition]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}:${ms}0`;
  };

  // Seek to position; when playing, update playback start so playhead stays there
  const seekTo = React.useCallback(
    (position: number) => {
      const newPos = Math.max(0, Math.min(position, projectDuration));
      setTimelinePosition(newPos);
      if (useEditorStore.getState().isPlaying) {
        playbackStartRef.current = {
          time: performance.now(),
          position: newPos,
        };
      }
    },
    [projectDuration, setTimelinePosition],
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "bg-bg-panel flex flex-col h-full select-none relative",
        className,
      )}
    >
      {/* Resize Handle */}
      <div
        onMouseDown={startResizing}
        className="absolute -top-1.5 left-0 right-0 h-3 cursor-ns-resize z-60 flex items-center justify-center group"
      >
        <div className="w-12 h-0.5 bg-white/10 group-hover:bg-[#5956E8] rounded-full transition-all group-hover:shadow-[0_0_10px_rgba(89,86,232,0.5)]" />
      </div>

      {/* Timeline Controls */}
      <div className="h-14 border-y border-white/5 flex items-center px-6 justify-between bg-bg-panel relative z-50">
        <div className="flex items-center gap-8">
          <div className="text-[14px] font-black text-[#5956E8] tabular-nums tracking-widest bg-[#5956E8]/10 px-4 py-1.5 rounded-lg border border-[#5956E8]/20 shadow-[0_0_15px_rgba(89,86,232,0.1)]">
            {formatTime(timelinePosition)}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => seekTo(0)}
              title="Skip to Beginning"
              className="p-2 hover:bg-white/5 rounded-lg transition-all text-zinc-500 hover:text-white"
            >
              <SkipBack size={16} />
            </button>
            <button
              onClick={() => seekTo(timelinePosition - 1)}
              title="Jump Back (1s)"
              className="p-2 hover:bg-white/5 rounded-lg transition-all text-zinc-500 hover:text-white"
            >
              <Minus size={14} />
            </button>
            <button
              onClick={() => {
                resumeAudioContextOnGesture();
                if (!isPlaying && timelinePosition >= projectDuration - 0.01) {
                  seekTo(0);
                }
                togglePlay();
              }}
              className="w-10 h-10 bg-[#5956E8] text-white rounded-full flex items-center justify-center hover:bg-[#6a67ff] transition-all active:scale-90 shadow-[0_0_20px_rgba(89,86,232,0.4)]"
            >
              {isPlaying ? (
                <Pause size={18} fill="currentColor" />
              ) : (
                <Play size={18} fill="currentColor" className="ml-1" />
              )}
            </button>
            <button
              onClick={() => seekTo(timelinePosition + 1)}
              title="Jump Forward (1s)"
              className="p-2 hover:bg-white/5 rounded-lg transition-all text-zinc-500 hover:text-white"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={() => seekTo(projectDuration)}
              title="Skip to End"
              className="p-2 hover:bg-white/5 rounded-lg transition-all text-zinc-500 hover:text-white"
            >
              <SkipForward size={16} />
            </button>
          </div>
        </div>

        {/* Relocated Info Bar */}
        <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em]">
          <div className="flex items-center gap-4 px-4 py-2 bg-white/[0.02] rounded-lg border border-white/5">
            <div className="flex flex-col">
              <span className="text-zinc-600 text-[8px]">RESOLUTION</span>
              <span className="text-white">
                {(() => {
                  const l = currentPage?.layout || "16:9";
                  if (l === "1:1") return "1080X1080";
                  if (l === "16:9") return "1920X1080";
                  if (l === "9:16") return "1080X1920";
                  if (l === "4:5") return "1080X1350";
                  if (l === "2:3") return "1080X1620";
                  return "1920X1080";
                })()}
              </span>
            </div>
            <div className="w-px h-6 bg-white/5" />
            <div className="flex flex-col">
              <span className="text-zinc-600 text-[8px]">ASPECT RATIO</span>
              <span className="text-accent">
                {currentPage?.layout || "16:9"}
              </span>
            </div>
          </div>

          <div className="flex flex-col px-4 py-2 bg-white/2 rounded-lg border border-white/5 min-w-35">
            <span className="text-zinc-600 text-[8px]">PROJECT PROGRESS</span>
            <div className="flex items-center gap-1.5 text-white tabular-nums">
              <span className="text-accent">
                {formatTime(timelinePosition)}
              </span>
              <span className="text-white/10">|</span>
              <span className="text-text-muted">
                {formatTime(projectDuration)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 border-l border-border pl-4">
          {/* Zoom Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTimelineZoom(Math.max(10, timelineZoom - 10))}
              className="p-2 hover:bg-white/5 rounded-lg transition-all text-text-muted hover:text-text-main"
            >
              <ZoomOut size={16} />
            </button>
            <div className="w-32 h-1 bg-zinc-800 rounded-full relative overflow-visible">
              <div
                className="absolute left-0 top-0 h-full bg-accent rounded-full shadow-[0_0_10px_rgba(89,86,232,0.5)] transition-all duration-300"
                style={{ width: `${(timelineZoom / 200) * 100}%` }}
              />
              <div
                className="absolute w-3 h-3 bg-white rounded-full top-1/2 -translate-y-1/2 shadow-lg border-2 border-accent transition-all"
                style={{ left: `calc(${(timelineZoom / 200) * 100}% - 6px)` }}
              />
            </div>
            <button
              onClick={() => setTimelineZoom(Math.min(200, timelineZoom + 10))}
              className="p-2 hover:bg-white/5 rounded-lg transition-all text-text-muted hover:text-text-main"
            >
              <ZoomIn size={16} />
            </button>
          </div>

          <div className="h-4 w-px bg-white/10 mx-2" />

          {/* Height Mode Selector */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
            {[
              { id: "small", icon: PanelBottomOpen, label: "Small" },
              { id: "default", icon: PanelBottom, label: "Default" },
              { id: "big", icon: StretchVertical, label: "Large" },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => {
                  setTimelineHeightMode(mode.id as any);
                  if (mode.id === "default") setTimelineHeight(256);
                  if (mode.id === "big") setTimelineHeight(450);
                }}
                title={`${mode.label} Timeline`}
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  timelineHeightMode === mode.id
                    ? "bg-[#5956E8] text-white shadow-[0_0_10px_rgba(89,86,232,0.3)]"
                    : "text-text-muted hover:text-text-main hover:bg-white/5",
                )}
              >
                <mode.icon size={14} />
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-white/10 mx-2" />

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            className="p-2 hover:bg-white/5 rounded-lg transition-all text-text-muted hover:text-text-main"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>
      </div>

      {/* Timeline Tracks Area */}
      <div
        ref={tracksScrollRef}
        className={cn(
          "flex-1 overflow-x-auto overflow-y-auto no-scrollbar relative z-10 transition-all bg-bg-panel",
          timelineHeightMode === "small" && "overflow-hidden",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDrop={handleTimelineDrop}
        onMouseDown={onTracksMouseDown}
      >
        <div
          className="flex flex-col relative"
          style={{ width: HEADER_WIDTH + totalDuration * PX_PER_SEC }}
        >
          {/* Timeline Ruler */}
          <div
            className="sticky top-0 h-10 border-b border-white/5 bg-bg-panel flex items-center z-30 cursor-crosshair overflow-hidden"
            onMouseDown={onRulerMouseDown}
            style={{ marginLeft: HEADER_WIDTH }}
          >
            {Array.from({
              length: Math.ceil(totalDuration / scaleConfig.major) + 1,
            }).map((_, i) => {
              const time = i * scaleConfig.major;
              return (
                <div
                  key={time}
                  className="absolute h-full border-l border-white/10 flex items-end pb-2 px-1.5 shrink-0"
                  style={{ left: time * PX_PER_SEC }}
                >
                  <span className="text-[10px] font-black text-zinc-600 font-mono whitespace-nowrap tracking-tighter">
                    {scaleConfig.label(time)}
                  </span>
                </div>
              );
            })}
            {/* Minor ticks */}
            {PX_PER_SEC > 5 &&
              Array.from({
                length: Math.ceil(totalDuration / scaleConfig.minor) + 1,
              }).map((_, i) => {
                const time = i * scaleConfig.minor;
                if (time % scaleConfig.major === 0) return null;
                return (
                  <div
                    key={`minor-${time}`}
                    className="absolute border-l border-white/5 h-2 bottom-0"
                    style={{ left: time * PX_PER_SEC }}
                  />
                );
              })}
          </div>

          {tracks.map((track) => {
            const sorted = [...track.items].sort(
              (a, b) => a.startTime - b.startTime,
            );
            const rows: any[][] = [];
            sorted.forEach((el) => {
              let placed = false;
              for (const row of rows) {
                const last = row[row.length - 1];
                const gap = 0.05;
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

            const rowCount = rows.length || 1;
            const rowHeight = 40;
            const totalHeight = rowCount * rowHeight + 12;

            return (
              <div
                key={track.label}
                className="grid grid-cols-[120px_1fr] border-b border-white/3 group overflow-hidden"
                style={{ minHeight: totalHeight }}
              >
                <div className="sticky left-0 bg-bg-panel z-20 px-6 flex items-center border-r border-white/5 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] group-hover:text-accent transition-all duration-300">
                  {track.label}
                </div>
                <div className="relative h-full py-2 bg-black/20">
                  {/* Vertical grid lines */}
                  {Array.from({
                    length: Math.ceil(totalDuration / scaleConfig.major) + 1,
                  }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 border-l border-white/[0.02] pointer-events-none"
                      style={{ left: i * scaleConfig.major * PX_PER_SEC }}
                    />
                  ))}

                  {rows.map((row, rowIndex) => (
                    <React.Fragment key={rowIndex}>
                      {row.map((element) => (
                        <div
                          key={element.id}
                          onMouseDown={(e) =>
                            onSegmentMouseDown(e, element, "move")
                          }
                          className={cn(
                            "absolute h-9 rounded-lg border flex items-center px-3 cursor-move transition-all duration-300 z-10 overflow-hidden group/segment",
                            track.color,
                            selectedElementId === element.id
                              ? "border-[#5956E8] bg-[#5956E8]/20 z-20 shadow-[0_0_20px_rgba(89,86,232,0.2)]"
                              : "border-white/5 hover:border-white/20 bg-white/5 hover:bg-white/[0.08]",
                          )}
                          style={{
                            left: element.startTime * PX_PER_SEC,
                            width: element.duration * PX_PER_SEC,
                            top: rowIndex * rowHeight + 10,
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
                          {selectedElementId === element.id && (
                            <>
                              <div
                                className="absolute left-0 top-0 bottom-0 w-1.5 hover:bg-[#5956E8] bg-[#5956E8]/40 cursor-ew-resize transition-all"
                                onMouseDown={(e) =>
                                  onSegmentMouseDown(e, element, "trim-left")
                                }
                              />
                              <div
                                className="absolute right-0 top-0 bottom-0 w-1.5 hover:bg-[#5956E8] bg-[#5956E8]/40 cursor-ew-resize transition-all"
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

          {/* Playhead Layer */}
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-[#5956E8] z-40 pointer-events-none transition-none shadow-[0_0_15px_rgba(89,86,232,0.8)]"
            style={{
              left: HEADER_WIDTH + timelinePosition * PX_PER_SEC,
              height: "100%",
            }}
          >
            <div className="w-4 h-4 bg-[#5956E8] rounded-full -translate-x-1/2 -mt-2 shadow-[0_0_10px_rgba(89,86,232,0.5)] border-2 border-white flex items-center justify-center">
              <div className="w-1 h-1 bg-white rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Layout Tabs Bar - Bottom Area */}
      <div className="h-10 bg-[#1A1A1E] border-t border-border flex items-center px-4 gap-2">
        <div className="flex items-center bg-[#111114] rounded-md p-0.5 border border-border/50">
          {pages.map((page, index) => (
            <div
              key={page.id}
              data-page-tab-id={page.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(
                  "application/json",
                  JSON.stringify({ type: "page-tab", index, pageId: page.id }),
                );
                e.dataTransfer.effectAllowed = "move";
              }}
              onClick={() => setCurrentPage(page.id)}
              onDoubleClick={() => {
                setEditingPageId(page.id);
                setEditingPageValue(page.name || `LAYOUT ${index + 1}`);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={(e) => {
                e.preventDefault();
                const raw = e.dataTransfer.getData("application/json");
                if (raw) {
                  const data = JSON.parse(raw);
                  if (data.type === "canvas-element" && data.elementId) {
                    moveElementToPage(data.pageId, page.id, data.elementId);
                  } else if (data.type === "page-tab") {
                    reorderPages(data.index, index);
                  }
                }
              }}
              className={cn(
                "group relative px-4 py-1 rounded-sm text-[11px] font-bold cursor-pointer transition-all flex items-center gap-2",
                currentPageId === page.id
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-text-muted hover:text-text-main hover:bg-white/5",
              )}
            >
              {editingPageId === page.id ? (
                <input
                  autoFocus
                  className="bg-black/20 text-white outline-none px-1 rounded border border-white/20 w-32 uppercase"
                  value={editingPageValue}
                  onChange={(e) => setEditingPageValue(e.target.value)}
                  onBlur={() => handleRenameSubmit(page.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRenameSubmit(page.id);
                    if (e.key === "Escape") setEditingPageId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="uppercase whitespace-nowrap">
                  {page.name || `LAYOUT ${index + 1}`}
                </span>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  duplicatePage(page.id);
                }}
                title="Duplicate Layout"
                className={cn(
                  "w-5 h-5 rounded flex items-center justify-center transition-all opacity-0 group-hover:opacity-100",
                  currentPageId === page.id
                    ? "hover:bg-white/20 text-white"
                    : "hover:bg-white/10 text-text-muted hover:text-text-main",
                )}
              >
                <Copy size={10} />
              </button>

              {pages.length > 1 && !editingPageId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePage(page.id);
                  }}
                  className={cn(
                    "w-3 h-3 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100",
                    currentPageId === page.id
                      ? "hover:bg-white/20"
                      : "hover:bg-white/10",
                  )}
                >
                  <Minus size={10} />
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={addPage}
          className="w-7 h-7 flex items-center justify-center rounded-md bg-white/5 border border-border/50 text-text-muted hover:text-text-main hover:bg-white/10 transition-all active:scale-95"
          title="Add New Layout"
        >
          <Plus size={14} />
        </button>

        <div className="flex-1" />

        <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider hidden md:block">
          {pages.length} Layout{pages.length !== 1 ? "s" : ""} in project
        </div>
      </div>
    </div>
  );
}
