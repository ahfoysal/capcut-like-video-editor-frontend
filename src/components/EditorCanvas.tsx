import React from "react";
import { cn, formatTimeShort } from "@/lib/utils";
import { Music } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";

const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
) => {
  let inThrottle: boolean;
  let lastResult: ReturnType<T>;
  let lastArgs: Parameters<T>;
  let lastThis: any;
  let timeout: ReturnType<typeof setTimeout>;

  return function (this: any, ...args: Parameters<T>): ReturnType<T> {
    lastArgs = args;
    lastThis = this;
    if (!inThrottle) {
      inThrottle = true;
      lastResult = func.apply(lastThis, lastArgs);
      timeout = setTimeout(() => {
        inThrottle = false;
        if (lastArgs && lastThis) {
          lastResult = func.apply(lastThis, lastArgs);
          lastArgs = null;
          lastThis = null;
        }
      }, limit);
    }
    return lastResult;
  };
};


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
  type: "video" | "audio"
): Promise<number> => {
  return new Promise((resolve) => {
    const media = document.createElement(type);
    media.crossOrigin = "anonymous";
    media.src = url;

    const timeout = setTimeout(() => {
      resolve(5); // Fallback to 5s if metadata takes too long
    }, 2000);

    media.onloadedmetadata = () => {
      clearTimeout(timeout);
      resolve(media.duration || 5);
    };

    media.onerror = () => {
      clearTimeout(timeout);
      resolve(5);
    };
  });
};

const CanvasElement = React.memo(
  ({
    element,
    isSelected,
    handleMouseDown,
    setEditingElementId,
    editingElementId,
    timelinePosition,
    isPlaying,
    updateElement,
    currentPageId,
  }: {
    element: any;
    isSelected: boolean;
    handleMouseDown: (
      e: React.MouseEvent,
      element: any,
      type: "move" | "resize"
    ) => void;
    setEditingElementId: React.Dispatch<React.SetStateAction<string | null>>;
    editingElementId: string | null;
    timelinePosition: number;
    isPlaying: boolean;
    updateElement: (
      pageId: string,
      elementId: string,
      updates: Record<string, any>
    ) => void;
    currentPageId: string | undefined;
  }) => {
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

    return (
      <div
        key={element.id}
        data-element-id={element.id}
        onMouseDown={(e) => handleMouseDown(e, element, "move")}
        onDoubleClick={() => {
          if (element.type === "text") {
            setEditingElementId(element.id);
          }
        }}
        className={cn(
          "absolute select-none group/el",
          isSelected &&
            "ring-[3px] ring-accent z-50 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
        )}
        style={{
          left: `${element.position.x}px`,
          top: `${element.position.y}px`,
          width: `${element.size.width}px`,
          height:
            element.type === "text"
              ? "auto"
              : `${element.size.height}px`,
          minHeight:
            element.type === "text"
              ? `${element.size.height}px`
              : undefined,
          zIndex: isSelected ? 100 : (element as any).layer ?? 0,
        }}
      >
        {element.type === "image" && (
          <img
            src={getAssetUrl(element.src)}
            alt={element.name}
            crossOrigin="anonymous"
            className="w-full h-full  object-cover"
            style={{
              backgroundColor: (element as any).backgroundColor,
              borderRadius: (element as any).borderRadius || "0px",
              opacity: (element.opacity || 100) / 100,
            }}
          />
        )}

        {element.type === "video" && (
          <div
            className="w-full h-full bg-black relative overflow-hidden"
            style={{
              opacity: ((element as any).opacity ?? 100) / 100,
              borderRadius: (element as any).borderRadius || "0px",
            }}
          >
            <video
              src={getAssetUrl(element.src)}
              crossOrigin="anonymous"
              preload="auto"
              playsInline
              muted
              className="w-full h-full object-cover"
              ref={(el) => {
                if (el) {
                  const offset = timelinePosition - element.startTime;
                  if (Math.abs(el.currentTime - offset) > 0.1) {
                    el.currentTime = offset;
                  }
                  if (isPlaying && el.paused) el.play().catch(() => {});
                  else if (!isPlaying && !el.paused) el.pause();
                }
              }}
            />
          </div>
        )}

        {element.type === "audio" && (
          <div
            className="w-full h-full bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center justify-center gap-2 px-3"
            style={{ opacity: (element.opacity || 100) / 100 }}
          >
            <Music
              size={16}
              className="text-cyan-400 group-hover/el:scale-110 transition-transform"
            />
            <span className="text-[10px] font-bold text-cyan-400 truncate uppercase tracking-tighter">
              {element.name || "Audio Block"}
            </span>
          </div>
        )}

        {element.type === "text" && (
          <div
            className="w-full flex items-center justify-center break-words text-center px-4 py-2"
            style={{
              fontSize: `${(element as any).fontSize}px`,
              fontWeight: (element as any).fontWeight,
              color: (element as any).color || "#ffffff",
              backgroundColor:
                (element as any).backgroundColor || "transparent",
              opacity: ((element as any).opacity ?? 100) / 100,
              textAlign:
                ((element as any).textAlign as any) || "center",
              lineHeight: 1.1,
              borderRadius: (element as any).borderRadius || "0px",
              pointerEvents: editingElementId === element.id ? "all" : "none",
            }}
          >
            {editingElementId === element.id ? (
              <textarea
                autoFocus
                defaultValue={(element as any).content}
                onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => {
                  if (currentPageId) {
                    updateElement(currentPageId, element.id, {
                      content: e.target.value,
                    });
                  }
                  setEditingElementId(null);
                }}
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    (e.target as HTMLTextAreaElement).blur();
                  }
                }}
                className="w-full bg-transparent border-none outline-none resize-none text-center p-0 font-inherit overflow-hidden"
                style={{
                  color: "inherit",
                  fontSize: "inherit",
                  fontWeight: "inherit",
                  lineHeight: "inherit",
                  height: "auto",
                  minHeight: "1em",
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />
            ) : (
              (element as any).content
            )}
          </div>
        )}

        {element.type === "shape" && (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              color: (element as any).color || "#3b82f6",
              opacity: ((element as any).opacity ?? 100) / 100,
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-full h-full"
            >
              {(element as any).shapeType === "Square" && (
                <rect width="18" height="18" x="3" y="3" rx="2" />
              )}
              {(element as any).shapeType === "Circle" && (
                <circle cx="12" cy="12" r="10" />
              )}
              {(element as any).shapeType === "Triangle" && (
                <path d="M3 20h18L12 4z" />
              )}
              {(element as any).shapeType === "Star" && (
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              )}
              {(element as any).shapeType === "Heart" && (
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              )}
              {(element as any).shapeType === "Rocket" && (
                <path d="M4.5 16.5c-1.5 1.26-2 2.67-2 4.5 0 0 0 0 0 0s0 0 0 0c1.83 0 3.24-.5 4.5-2L4.5 16.5Z m10-15C18.5 2 21.5 5 22 9.5c0 2-1 5-4.5 8s-6.5 4.5-8.5 4.5-3-3.5-3-3.5 1-1 4-4.5 6-6.5 6-8.5Z" />
              )}
              {(element as any).shapeType === "Smile" && (
                <>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" x2="9.01" y1="9" y2="9" />
                  <line x1="15" x2="15.01" y1="9" y2="9" />
                </>
              )}
              {(element as any).shapeType === "Zap" && (
                <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
              )}
              {(element as any).shapeType === "Sparkle" && (
                <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.937A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0L9.937 15.5Z" />
              )}
            </svg>
          </div>
        )}

        {/* Selection Handles */}
        {isSelected && (
          <>
            <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-accent rounded-full shadow-lg z-50" />
            <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-accent rounded-full shadow-lg z-50" />
            <div className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-accent rounded-full shadow-lg z-50" />
            <div
              className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white border-2 border-accent rounded-full shadow-lg cursor-se-resize hover:scale-125 transition-transform z-50"
              onMouseDown={(e) => handleMouseDown(e, element, "resize")}
            />
          </>
        )}
      </div>
    );
  }
);
CanvasElement.displayName = "CanvasElement";

export function EditorCanvas() {
  const {
    pages,
    currentPageId,
    selectedElementId,
    setSelectedElement,
    updateElement,
    timelinePosition,
    isPlaying,
    zoom,
    pushHistory,
    undo,
    redo,
    deleteElement,
    copyElement,
    pasteElement,
  } = useEditorStore();

  const [editingElementId, setEditingElementId] = React.useState<string | null>(
    null
  );

  const currentPage = React.useMemo(
    () => pages.find((p) => p.id === currentPageId),
    [pages, currentPageId]
  );
  const { width: TOTAL_WIDTH, height: TOTAL_HEIGHT } = React.useMemo(
    () => getLayoutDimensions(currentPage?.layout || "16:9"),
    [currentPage?.layout]
  );
  const allElements = React.useMemo(
    () => currentPage?.elements || [],
    [currentPage?.elements]
  );

  // Filter elements that should be visible at the current playhead
  const elements = allElements.filter(
    (el) =>
      el.type !== "audio" && // Hide audio from visual canvas
      timelinePosition >= el.startTime &&
      timelinePosition <= el.startTime + el.duration
  );

  // All audio elements (render every one so they preload; each only plays when in range)
  const allAudioElements = allElements.filter((el) => el.type === "audio");

  const maxDuration = allElements.reduce((max, el) => {
    return Math.max(max, el.startTime + el.duration);
  }, 0);
  const totalDuration = maxDuration;

  const [dragState, setDragState] = React.useState<{
    id: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    type: "move" | "resize";
  } | null>(null);

  const handleMouseDown = (
    e: React.MouseEvent,
    element: any,
    type: "move" | "resize"
  ) => {
    e.stopPropagation();
    pushHistory(); // Record state before changes
    setSelectedElement(element.id);
    setDragState({
      id: element.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: element.position.x,
      initialY: element.position.y,
      type,
    });
  };

  const throttledUpdateElement = React.useCallback(
    throttle((pageId, elementId, updates) => {
      useEditorStore.getState().updateElement(pageId, elementId, updates);
    }, 30),
    []
  );

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent) => {
      if (!dragState || !currentPageId) return;

      const scale = zoom / 100;
      const dx = (e.clientX - dragState.startX) / scale;
      const dy = (e.clientY - dragState.startY) / scale;

      const element = allElements.find((el) => el.id === dragState.id);
      if (!element) return;

      if (dragState.type === "move") {
        throttledUpdateElement(currentPageId, dragState.id, {
          position: {
            x: dragState.initialX + dx,
            y: dragState.initialY + dy,
          },
        });
      } else if (dragState.type === "resize") {
        const newWidth = Math.max(20, element.size.width + dx);
        const newHeight = Math.max(20, element.size.height + dy);

        const updates: any = {
          size: {
            width: newWidth,
            height: newHeight,
          },
        };

        // If it's a text element, scale the font size proportional to height change
        if (element.type === "text") {
          const heightRatio = newHeight / element.size.height;
          updates.fontSize = Math.round(
            (element as any).fontSize * heightRatio
          );
        }

        throttledUpdateElement(currentPageId, dragState.id, updates);

        // Update start positions to handle continuous resizing
        setDragState({
          ...dragState,
          startX: e.clientX,
          startY: e.clientY,
        });
      }
    },
    [dragState, currentPageId, zoom, allElements, throttledUpdateElement]
  );

  const handleMouseUp = () => {
    setDragState(null);
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        ["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName) ||
        (e.target as HTMLElement).isContentEditable;
      if (isInput) return;

      // Delete/Backspace
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedElementId &&
        currentPageId
      ) {
        e.preventDefault();
        deleteElement(currentPageId, selectedElementId);
      }

      // Copy: Ctrl+C or Cmd+C
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        if (selectedElementId) {
          e.preventDefault();
          copyElement(selectedElementId);
        }
      }

      // Paste: Ctrl+V or Cmd+V
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        e.preventDefault();
        pasteElement();
      }

      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Redo: Ctrl+Y, Cmd+Y or Ctrl+Shift+Z, Cmd+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && e.key === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z")
      ) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    undo,
    redo,
    deleteElement,
    currentPageId,
    selectedElementId,
    copyElement,
    pasteElement,
  ]);

  const AudioPlayer = React.memo(
    ({ element, isPlaying }: { element: any; isPlaying: boolean }) => {
      const audioRef = React.useRef<HTMLAudioElement>(null);
      const lastSyncTime = React.useRef(0);
      const [isReady, setIsReady] = React.useState(false);

      const srcUrl = getAssetUrl(element.src);

      // Wait for audio to be ready to play
      React.useEffect(() => {
        const el = audioRef.current;
        if (!el || !srcUrl) return;
        const onCanPlay = () => setIsReady(true);
        el.addEventListener("canplaythrough", onCanPlay);
        if (el.readyState >= 3) setIsReady(true);
        return () => el.removeEventListener("canplaythrough", onCanPlay);
      }, [srcUrl]);

      // Sync playback with timeline (read from ref so we don't re-render 60fps)
      React.useEffect(() => {
        const el = audioRef.current;
        if (!el || !isReady) return;

        const SYNC_INTERVAL_MS = 40;

        const sync = () => {
          const state = useEditorStore.getState();
          const t = state.isPlaying
            ? state.playbackTimeRef.current
            : state.timelinePosition;
          const offset = t - element.startTime;
          const inRange = offset >= 0 && offset <= element.duration;
          const clampedOffset = Math.max(0, Math.min(offset, element.duration));
          const volume = (element.volume ?? 100) / 100;

          el.muted = false;
          el.volume = Math.min(1, Math.max(0, volume));

          if (state.isPlaying) {
            if (inRange) {
              const diff = Math.abs(el.currentTime - clampedOffset);
              if (el.paused || diff > 0.1) {
                el.currentTime = clampedOffset;
                el.play().catch(() => {});
                lastSyncTime.current = Date.now();
              }
            } else {
              if (!el.paused) el.pause();
            }
          } else {
            if (!el.paused) el.pause();
            const now = Date.now();
            if (now - lastSyncTime.current > 150) {
              el.currentTime = clampedOffset;
              lastSyncTime.current = now;
            }
          }
        };

        sync();
        const id = setInterval(sync, SYNC_INTERVAL_MS);
        return () => clearInterval(id);
      }, [
        isPlaying,
        element.startTime,
        element.duration,
        element.volume,
        isReady,
        element.id,
      ]);

      if (!srcUrl) return null;

      return (
        <audio
          ref={audioRef}
          src={srcUrl}
          preload="auto"
          crossOrigin="anonymous"
          muted={false}
          playsInline
        />
      );
    }
  );
  AudioPlayer.displayName = "AudioPlayer";

  // Helper to draw elements to canvas (ONLY for export recording)
  React.useEffect(() => {
    const isExporting = document.body.classList.contains("export-in-progress");
    if (!isExporting) return;

    const canvas = document.getElementById(
      "editor-canvas"
    ) as HTMLCanvasElement;
    if (!canvas) return;

    const dims = getLayoutDimensions(currentPage?.layout || "16:9");
    if (canvas.width !== dims.width || canvas.height !== dims.height) {
      canvas.width = dims.width;
      canvas.height = dims.height;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const visibleElements = allElements
      .filter(
        (el) =>
          timelinePosition >= el.startTime &&
          timelinePosition <= el.startTime + el.duration
      )
      .sort((a, b) => ((a as any).layer ?? 0) - ((b as any).layer ?? 0));

    visibleElements.forEach((el) => {
      ctx.save();
      ctx.globalAlpha = (el.opacity || 100) / 100;

      const { x, y } = el.position;
      const { width, height } = el.size;

      if (el.type === "image" || el.type === "video") {
        const mediaTag = document.querySelector(
          `[data-element-id="${el.id}"] ${el.type}`
        ) as HTMLImageElement | HTMLVideoElement;
        if (mediaTag) {
          try {
            ctx.drawImage(mediaTag, x, y, width, height);
          } catch (e) {
            ctx.fillStyle = "#333";
            ctx.fillRect(x, y, width, height);
          }
        }
      } else if (el.type === "text") {
        ctx.fillStyle = (el as any).color || "#ffffff";
        ctx.font = `${(el as any).fontWeight || "bold"} ${
          (el as any).fontSize
        }px Sans-Serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText((el as any).content, x + width / 2, y + height / 2);
      } else if (el.type === "shape") {
        ctx.fillStyle = (el as any).color || "#3b82f6";
        ctx.beginPath();
        if ((el as any).shapeType === "Circle") {
          ctx.arc(
            x + width / 2,
            y + height / 2,
            Math.min(width, height) / 2,
            0,
            Math.PI * 2
          );
        } else {
          ctx.rect(x, y, width, height);
        }
        ctx.fill();
      }
      ctx.restore();
    });
  }, [timelinePosition, allElements, currentPage?.layout]);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const data = e.dataTransfer.getData("application/json");
      console.log("Dropped data:", data);
      const asset = JSON.parse(data);
      if (!currentPageId) {
        console.warn("No current page ID selected");
        return;
      }

      const scale = zoom / 100;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;

      const assetSrc = getAssetUrl(asset.url || asset.src);
      let duration = 5;

      if (asset.type === "video" || asset.type === "audio") {
        duration = await getMediaDuration(assetSrc, asset.type);
      } else if (asset.type === "image") {
        duration = 10; // Default images to 10s
      }

      const newElement: any = {
        id: `el-${Date.now()}`,
        type: asset.type,
        name: asset.name || asset.label,
        position: { x: x - 100, y: y - 75 },
        size: { width: 200, height: 150 },
        duration,
        startTime: timelinePosition,
        freePosition: true,
        opacity: 100,
        layer: Date.now(),
      };

      if (asset.type === "image") {
        newElement.src = asset.url || asset.src;
        newElement.fill = "fill";
        newElement.size = { width: 400, height: 300 };
      } else if (asset.type === "video") {
        newElement.src = asset.url || asset.src;
        newElement.thumbnail = asset.thumbnail;
        newElement.volume = 75;
        newElement.fill = "fill";
        newElement.size = { width: 320, height: 180 };
      } else if (asset.type === "shape") {
        newElement.type = "shape";
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
        newElement.type = "audio";
        newElement.src = asset.url || asset.src;
        newElement.volume = 100;
        newElement.size = { width: 150, height: 60 };
      }

      useEditorStore.getState().addElement(currentPageId, newElement);
    } catch (err) {
      console.error("Drop failed:", err);
    }
  };

  return (
    <div
      className="w-full h-full flex flex-col items-center  justify-center p-8 bg-[#111114] overflow-auto relative"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Canvas Container */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        style={{
          width: `${TOTAL_WIDTH}px`,
          height: `${TOTAL_HEIGHT}px`,
          transform: `scale(${zoom / 100})`,
          transformOrigin: "center center",
          flexShrink: 0,
        }}
        className="relative shadow-2xl bg-white border border-border/50 rounded-sm overflow-hidden group transition-all duration-300"
      >
        {/* Hidden Canvas for Recording (DO NOT REMOVE) */}
        <canvas
          id="editor-canvas"
          width={TOTAL_WIDTH}
          height={TOTAL_HEIGHT}
          className="absolute inset-0 w-full h-full pointer-events-none opacity-0"
        />

        {/* Hidden Audio Playback - render all audio so they preload; each plays only when in range */}
        <div
          style={{
            position: "absolute",
            opacity: 0,
            pointerEvents: "none",
            width: 0,
            height: 0,
          }}
          aria-hidden="true"
        >
          {allAudioElements.map((element) => (
            <AudioPlayer
              key={element.id}
              element={element}
              isPlaying={isPlaying}
            />
          ))}
        </div>
        {elements.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted gap-4">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-text-main uppercase tracking-widest">
                Masterpiece Awaits
              </p>
              <p className="text-[11px] font-medium text-text-muted mt-1">
                Drag and drop assets to start editing
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full relative">
            {elements.map((element) => (
              <CanvasElement
                key={element.id}
                element={element}
                isSelected={element.id === selectedElementId}
                handleMouseDown={handleMouseDown}
                setEditingElementId={setEditingElementId}
                editingElementId={editingElementId}
                timelinePosition={timelinePosition}
                isPlaying={isPlaying}
                updateElement={updateElement}
                currentPageId={currentPageId}
              />
            ))}
          </div>
        )}

        {/* Focus lines */}
        <div className="absolute inset-0 pointer-events-none border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Canvas Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 h-11 bg-bg-panel border border-border rounded-full flex items-center px-6 gap-6 text-[11px] font-bold text-text-main shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <span className="text-accent">
            {formatTimeShort(timelinePosition)}
          </span>
          <span className="text-text-muted">/</span>
          <span className="text-text-main">
            {formatTimeShort(totalDuration)}
          </span>
        </div>
        <div className="h-4 w-[1px] bg-border" />
        <div className="flex items-center gap-4 text-text-muted capitalize">
          <span>{currentPage?.layout || "16:9"}</span>
          <span className="text-[10px] opacity-30">|</span>
          <span>
            {TOTAL_WIDTH}X{TOTAL_HEIGHT}
          </span>
        </div>
      </div>
    </div>
  );
}
