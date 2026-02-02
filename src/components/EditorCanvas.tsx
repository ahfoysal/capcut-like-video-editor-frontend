import React from "react";
import { cn, formatTime, getLayoutDimensions } from "@/lib/utils";
import {
  Music,
  Grid3x3,
  Minimize,
  Play,
  Pause,
  RotateCw,
  Crop,
  Trash2,
  Maximize2,
  MoreHorizontal,
  ImageIcon,
} from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { GridOverlay } from "@/components/GridOverlay";
import { LayoutSelector } from "@/components/LayoutSelector";
import { GridCell, snapToCell } from "@/lib/gridLayouts";
import { Element } from "@/types/editor";

const generateElementId = () => `el-${Math.random().toString(36).substr(2, 9)}`;

// Helper to calculate rotation
const calculateRotation = (
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
  centerX: number,
  centerY: number,
) => {
  const startAngle = Math.atan2(startY - centerY, startX - centerX);
  const currentAngle = Math.atan2(currentY - centerY, currentX - centerX);
  const rotation = (currentAngle - startAngle) * (180 / Math.PI);
  return rotation;
};

const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number,
) => {
  let inThrottle: boolean = false;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;
  let lastResult: ReturnType<T>;

  return function (this: any, ...args: Parameters<T>): ReturnType<T> {
    if (!inThrottle) {
      inThrottle = true;
      lastResult = func.apply(this, args);
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          lastResult = func.apply(lastThis, lastArgs);
          lastArgs = null;
          lastThis = null;
        }
      }, limit);
    } else {
      lastArgs = args;
      lastThis = this;
    }
    return lastResult;
  };
};

// Local getLayoutDimensions removed

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
    isDragging,
    isObscuring,
  }: {
    element: any;
    isSelected: boolean;
    isDragging: boolean;
    handleMouseDown: (
      e: React.MouseEvent,
      element: any,
      type: "move" | "resize" | "rotate",
      handleType?: "nw" | "n" | "ne" | "w" | "e" | "sw" | "s" | "se",
    ) => void;
    setEditingElementId: React.Dispatch<React.SetStateAction<string | null>>;
    editingElementId: string | null;
    timelinePosition: number;
    isPlaying: boolean;
    updateElement: (
      pageId: string,
      elementId: string,
      updates: Record<string, any>,
    ) => void;
    currentPageId: string | undefined;
    isObscuring?: boolean;
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
        onClick={(e) => {
          e.stopPropagation(); // Prevent deselect
          if (isSelected && element.type === "text") {
            setEditingElementId(element.id);
          }
        }}
        onDoubleClick={() => {
          if (element.type === "text") {
            setEditingElementId(element.id);
          }
        }}
        className={cn(
          "absolute select-none group/el",
          isSelected &&
            "ring-[3px] ring-accent z-50 shadow-[0_0_15px_rgba(59,130,246,0.5)]",
          isDragging && "pointer-events-none opacity-50",
          isObscuring &&
            "opacity-20 pointer-events-none transition-opacity duration-300", // X-ray effect
        )}
        style={{
          left: `${element.position.x}px`,
          top: `${element.position.y}px`,
          width: `${element.size.width}px`,
          height: element.type === "text" ? "auto" : `${element.size.height}px`,
          minHeight:
            element.type === "text" ? `${element.size.height}px` : undefined,
          zIndex: (element as any).layer ?? 0,
          transform: `rotate(${element.rotation || 0}deg)`,
        }}
      >
        {/* Element Toolbar */}
        {isSelected && !isDragging && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white rounded-lg shadow-xl border border-gray-100 p-1 z-[100] animate-in slide-in-from-bottom-2 fade-in duration-200">
            <button
              className="p-1.5 hover:bg-gray-100 rounded-md text-gray-700 transition-colors"
              title="Replace"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 hover:bg-gray-100 rounded-md text-gray-700 transition-colors"
              title="Fit to Canvas"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 hover:bg-gray-100 rounded-md text-gray-700 transition-colors bg-blue-50 text-blue-600"
              title="Crop"
            >
              <Crop className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-gray-200 mx-0.5" />
            <button
              className="p-1.5 hover:bg-red-50 text-red-500 rounded-md transition-colors"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                useEditorStore
                  .getState()
                  .deleteElement(currentPageId!, element.id);
              }}
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 hover:bg-gray-100 rounded-md text-gray-700 transition-colors"
              title="More"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Rotation Handle */}
        {isSelected && !isDragging && (
          <div
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center cursor-move hover:scale-110 transition-transform z-[100]"
            onMouseDown={(e) => handleMouseDown(e, element, "rotate")}
          >
            <RotateCw className="w-3 h-3 text-gray-600" />
          </div>
        )}
        {element.type === "image" && (
          <div
            className="w-full h-full relative overflow-hidden"
            style={{ borderRadius: (element as any).borderRadius || "0px" }}
          >
            <img
              src={getAssetUrl(element.src)}
              alt={element.name}
              crossOrigin="anonymous"
              onLoad={(e) => {
                const img = e.target as HTMLImageElement;
                if (
                  currentPageId &&
                  (!(element as any).naturalWidth ||
                    !(element as any).naturalHeight)
                ) {
                  updateElement(currentPageId, element.id, {
                    naturalWidth: img.naturalWidth,
                    naturalHeight: img.naturalHeight,
                  } as any);
                }
              }}
              className={cn(
                "absolute",
                !element.crop && "w-full h-full",
                !element.crop &&
                  ((element as any).fill === "fit"
                    ? "object-contain"
                    : (element as any).fill === "stretch"
                      ? "object-fill"
                      : "object-cover"),
              )}
              style={{
                backgroundColor: (element as any).backgroundColor,
                opacity: (element.opacity || 100) / 100,
                objectPosition: element.objectPosition
                  ? `${element.objectPosition.x}% ${element.objectPosition.y}%`
                  : "center",
                ...(element.crop
                  ? {
                      width: `${10000 / element.crop.width}%`,
                      height: `${10000 / element.crop.height}%`,
                      left: `${(-element.crop.x * 100) / element.crop.width}%`,
                      top: `${(-element.crop.y * 100) / element.crop.height}%`,
                      objectFit: "cover",
                    }
                  : {}),
              }}
            />
          </div>
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
              onLoadedMetadata={(e) => {
                const video = e.target as HTMLVideoElement;
                if (
                  currentPageId &&
                  (!(element as any).naturalWidth ||
                    !(element as any).naturalHeight)
                ) {
                  updateElement(currentPageId, element.id, {
                    naturalWidth: video.videoWidth,
                    naturalHeight: video.videoHeight,
                  } as any);
                }
              }}
              className={cn(
                "absolute",
                !element.crop && "w-full h-full",
                !element.crop &&
                  ((element as any).fill === "fit"
                    ? "object-contain"
                    : (element as any).fill === "stretch"
                      ? "object-fill"
                      : "object-cover"),
              )}
              style={{
                objectPosition: element.objectPosition
                  ? `${element.objectPosition.x}% ${element.objectPosition.y}%`
                  : "center",
                ...(element.crop
                  ? {
                      width: `${10000 / element.crop.width}%`,
                      height: `${10000 / element.crop.height}%`,
                      left: `${(-element.crop.x * 100) / element.crop.width}%`,
                      top: `${(-element.crop.y * 100) / element.crop.height}%`,
                      objectFit: "cover",
                    }
                  : {}),
              }}
              ref={(el) => {
                if (el) {
                  const rawOffset = timelinePosition - element.startTime;
                  const naturalDuration = (element as any).naturalDuration;
                  const trimStart = element.trim?.start || 0;
                  const offset = naturalDuration
                    ? (rawOffset % naturalDuration) + trimStart
                    : rawOffset + trimStart;

                  // Only update if difference is significant to reduce lag
                  if (Math.abs(el.currentTime - offset) > 0.15) {
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
            className="w-full flex items-center justify-center wrap-break-word text-center px-4 py-2"
            style={{
              fontSize: `${(element as any).fontSize}px`,
              fontWeight: (element as any).fontWeight,
              fontFamily: (element as any).fontFamily || "Inter, sans-serif",
              color: (element as any).color || "#ffffff",
              backgroundColor:
                (element as any).backgroundColor || "transparent",
              opacity: ((element as any).opacity ?? 100) / 100,
              textAlign: ((element as any).textAlign as any) || "center",
              lineHeight: 1.1,
              borderRadius: (element as any).borderRadius || "0px",
              padding:
                (element as any).backgroundColor &&
                (element as any).backgroundColor !== "transparent"
                  ? "8px"
                  : "0px",
              WebkitTextStroke:
                (element as any).strokeWidth > 0
                  ? `${(element as any).strokeWidth}px ${(element as any).strokeColor || "#000000"}`
                  : "none",
              pointerEvents: isSelected ? "all" : "none",
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
            ) : (element as any).marquee ? (
              (() => {
                const speed = (element as any).marqueeSpeed || 10;
                const duration = Math.max(1, speed);
                const elapsed = Math.max(
                  0,
                  timelinePosition - element.startTime,
                );
                const progress = (elapsed % duration) / duration;
                const direction = (element as any).marqueeDirection || "left";

                // Formula to start at 0 (fully visible) and loop
                const offset =
                  direction === "left"
                    ? ((1.5 - progress) % 1) * 200 - 100
                    : ((0.5 + progress) % 1) * 200 - 100;
                return (
                  <div className="relative w-full h-full overflow-hidden flex items-center">
                    <div
                      className="whitespace-nowrap inline-block absolute will-change-transform"
                      style={{
                        left: 0,
                        transform: `translateX(${offset}%)`,
                      }}
                    >
                      {(element as any).content}
                    </div>
                  </div>
                );
              })()
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
            {/* Corners */}
            <div
              className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-accent rounded-full shadow-lg z-50 cursor-nw-resize hover:scale-125 transition-transform"
              onMouseDown={(e) => handleMouseDown(e, element, "resize", "nw")}
            />
            <div
              className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-accent rounded-full shadow-lg z-50 cursor-ne-resize hover:scale-125 transition-transform"
              onMouseDown={(e) => handleMouseDown(e, element, "resize", "ne")}
            />
            <div
              className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-accent rounded-full shadow-lg z-50 cursor-sw-resize hover:scale-125 transition-transform"
              onMouseDown={(e) => handleMouseDown(e, element, "resize", "sw")}
            />
            <div
              className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white border-2 border-accent rounded-full shadow-lg z-50 cursor-se-resize hover:scale-125 transition-transform"
              onMouseDown={(e) => handleMouseDown(e, element, "resize", "se")}
            />

            {/* Sides */}
            <div
              className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-white border-2 border-accent rounded-full shadow-lg z-50 cursor-w-resize hover:scale-125 transition-transform"
              onMouseDown={(e) => handleMouseDown(e, element, "resize", "w")}
            />
            <div
              className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-white border-2 border-accent rounded-full shadow-lg z-50 cursor-e-resize hover:scale-125 transition-transform"
              onMouseDown={(e) => handleMouseDown(e, element, "resize", "e")}
            />
            <div
              className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-accent rounded-full shadow-lg z-50 cursor-n-resize hover:scale-125 transition-transform"
              onMouseDown={(e) => handleMouseDown(e, element, "resize", "n")}
            />
            <div
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-accent rounded-full shadow-lg z-50 cursor-s-resize hover:scale-125 transition-transform"
              onMouseDown={(e) => handleMouseDown(e, element, "resize", "s")}
            />
          </>
        )}
      </div>
    );
  },
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
    setTimelinePosition,
    isPlaying,
    togglePlay,
    zoom,
    pushHistory,
    undo,
    redo,
    deleteElement,
    copyElement,
    pasteElement,
    setGridMode,
    setPageGridLayout,
    moveElementToPage,
    isFullscreen,
    toggleFullscreen,
  } = useEditorStore();

  const [editingElementId, setEditingElementId] = React.useState<string | null>(
    null,
  );
  const [hoveredCell, setHoveredCell] = React.useState<GridCell | null>(null);
  const [showLayoutSelector, setShowLayoutSelector] = React.useState(false);

  const currentPage = React.useMemo(
    () => pages.find((p) => p.id === currentPageId),
    [pages, currentPageId],
  );
  const { width: TOTAL_WIDTH, height: TOTAL_HEIGHT } = React.useMemo(
    () => getLayoutDimensions(currentPage || "16:9"),
    [currentPage?.layout, currentPage?.customSize],
  );
  const allElements = React.useMemo(
    () => currentPage?.elements || [],
    [currentPage?.elements],
  );

  // Filter elements that should be visible at the current playhead
  const elements = allElements.filter(
    (el) =>
      el.type !== "audio" && // Hide audio from visual canvas
      timelinePosition >= el.startTime &&
      timelinePosition <= el.startTime + el.duration,
  );

  // All audio elements (render every one so they preload; each only plays when in range)
  const allAudioElements = allElements.filter((el) => el.type === "audio");

  // Strict Layering Sort: Videos/Images (backgrounds) first, then Text/Shapes (overlays)
  // Secondary Sort: Maintain original array index (time-based or user-defined layer)
  const sortedElements = React.useMemo(() => {
    return [...elements].sort((a, b) => {
      const isMediaA = a.type === "video" || a.type === "image";
      const isMediaB = b.type === "video" || b.type === "image";

      if (isMediaA && !isMediaB) return -1; // Media goes back
      if (!isMediaA && isMediaB) return 1; // Overlay goes front
      return 0; // Maintain existing order within groups
    });
  }, [elements]);

  // "X-ray" Logic: Identify elements obscuring the selected element
  const obscuringIds = React.useMemo(() => {
    if (!selectedElementId) return new Set<string>();

    const selectedEl = elements.find((el) => el.id === selectedElementId);
    if (!selectedEl) return new Set<string>();

    const obscured = new Set<string>();
    const selectedIndex = sortedElements.findIndex(
      (el) => el.id === selectedElementId,
    );

    // Only look at elements rendered *after* (on top of) the selected element
    for (let i = selectedIndex + 1; i < sortedElements.length; i++) {
      const el = sortedElements[i];
      // Simple bounding box intersection check
      const intersects =
        selectedEl.position.x < el.position.x + el.size.width &&
        selectedEl.position.x + selectedEl.size.width > el.position.x &&
        selectedEl.position.y < el.position.y + el.size.height &&
        selectedEl.position.y + selectedEl.size.height > el.position.y;

      if (intersects) {
        obscured.add(el.id);
      }
    }
    return obscured;
  }, [selectedElementId, elements, sortedElements]);

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
    initialWidth: number;
    initialHeight: number;
    initialObjectPosition?: { x: number; y: number };
    initialCrop?: { x: number; y: number; width: number; height: number };
    initialRotation?: number;
    centerX?: number;
    centerY?: number;
    type: "move" | "resize" | "rotate";
    handleType?: "nw" | "n" | "ne" | "w" | "e" | "sw" | "s" | "se";
  } | null>(null);

  const handleMouseDown = (
    e: React.MouseEvent,
    element: Element,
    type: "move" | "resize",
    handleType?: "nw" | "n" | "ne" | "w" | "e" | "sw" | "s" | "se",
  ) => {
    e.preventDefault();
    e.stopPropagation();
    pushHistory(); // Record state before changes
    setSelectedElement(element.id);
    setDragState({
      id: element.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: element.position.x,
      initialY: element.position.y,
      initialWidth: element.size.width,
      initialHeight: element.size.height,
      initialObjectPosition: element.objectPosition || { x: 50, y: 50 },
      initialCrop: element.crop || { x: 0, y: 0, width: 100, height: 100 },
      type,
      handleType,
    });
  };

  const throttledUpdateElement = React.useMemo(
    () =>
      throttle((pageId: string, elementId: string, updates: any) => {
        useEditorStore.getState().updateElement(pageId, elementId, updates);
      }, 30),
    [],
  );

  const throttledMoveToPage = React.useMemo(
    () =>
      throttle((sourceId: string, targetId: string, elementId: string) => {
        useEditorStore
          .getState()
          .moveElementToPage(sourceId, targetId, elementId);
      }, 500),
    [],
  );

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent) => {
      if (!dragState || !currentPageId) return;

      const scale = zoom / 100;
      const dx = (e.clientX - dragState.startX) / scale;
      const dy = (e.clientY - dragState.startY) / scale;

      const element = allElements.find((el) => el.id === dragState.id);
      if (!element) return;

      // Cross-page dragging check
      if (dragState.type === "move") {
        const elementAtPoint = document.elementFromPoint(e.clientX, e.clientY);
        const targetPageTab = elementAtPoint?.closest("[data-page-tab-id]");
        const targetPageId = targetPageTab?.getAttribute("data-page-tab-id");

        if (targetPageId && targetPageId !== currentPageId) {
          throttledMoveToPage(currentPageId, targetPageId, dragState.id);
          return;
        }
      }

      if (dragState.type === "move") {
        // Universal Alt + Drag for panning media
        if (
          e.altKey &&
          (element.type === "image" || element.type === "video")
        ) {
          const initCrop = dragState.initialCrop || {
            x: 0,
            y: 0,
            width: 100,
            height: 100,
          };
          const deltaX =
            (e.clientX - dragState.startX) / (scale * element.size.width);
          const deltaY =
            (e.clientY - dragState.startY) / (scale * element.size.height);

          // Panning essentially shifts the x/y of the crop box
          // We shift it in the OPPOSITE direction of the drag to move the "view"
          const newCropX = initCrop.x - deltaX * initCrop.width;
          const newCropY = initCrop.y - deltaY * initCrop.height;

          throttledUpdateElement(currentPageId, dragState.id, {
            crop: {
              ...initCrop,
              x: Math.max(0, Math.min(100 - initCrop.width, newCropX)),
              y: Math.max(0, Math.min(100 - initCrop.height, newCropY)),
            },
          });
          return;
        }

        let newSize = element.size;
        let gridCell = element.gridCell;

        let newX = dragState.initialX + dx;
        let newY = dragState.initialY + dy;

        // Snap to grid if enabled (for elements not currently in a grid cell)
        if (currentPage?.gridMode && currentPage?.gridLayout) {
          const snapped = snapToCell(
            newX + element.size.width / 2, // Snap center of element
            newY + element.size.height / 2,
            TOTAL_WIDTH,
            TOTAL_HEIGHT,
            currentPage.gridLayout,
          );

          if (snapped) {
            newX = snapped.x;
            newY = snapped.y;
            newSize = { width: snapped.width, height: snapped.height };
            gridCell = {
              cellId: snapped.cell.id,
              col: snapped.cell.col,
              row: snapped.cell.row,
            };

            // Highlight hovered cell
            setHoveredCell(snapped.cell);
          }
        }

        throttledUpdateElement(currentPageId, dragState.id, {
          position: { x: newX, y: newY },
          size: newSize,
          gridCell: gridCell,
        });
      } else if (dragState.type === "resize") {
        let newWidth = dragState.initialWidth;
        let newHeight = dragState.initialHeight;
        let newX = dragState.initialX;
        let newY = dragState.initialY;
        const handle = dragState.handleType || "se";

        // Image/Video: Preserve Aspect Ratio
        if (element.type === "image" || element.type === "video") {
          let scaleChange = 0;

          // Determine the scale change based on the handle being dragged
          if (handle === "e") scaleChange = dx / dragState.initialWidth;
          else if (handle === "w") scaleChange = -dx / dragState.initialWidth;
          else if (handle === "s") scaleChange = dy / dragState.initialHeight;
          else if (handle === "n") scaleChange = -dy / dragState.initialHeight;
          else if (handle === "se")
            scaleChange = Math.max(
              dx / dragState.initialWidth,
              dy / dragState.initialHeight,
            );
          else if (handle === "nw")
            scaleChange = Math.max(
              -dx / dragState.initialWidth,
              -dy / dragState.initialHeight,
            );
          else if (handle === "ne")
            scaleChange = Math.max(
              dx / dragState.initialWidth,
              -dy / dragState.initialHeight,
            );
          else if (handle === "sw")
            scaleChange = Math.max(
              -dx / dragState.initialWidth,
              dy / dragState.initialHeight,
            );

          const minScale =
            20 / Math.min(dragState.initialWidth, dragState.initialHeight);
          const finalScale = Math.max(minScale, 1 + scaleChange);

          newWidth = dragState.initialWidth * finalScale;
          newHeight = dragState.initialHeight * finalScale;

          // Mid handle scaling centers horizontally relative to the anchor side
          if (handle === "n" || handle === "s") {
            newX = dragState.initialX - (newWidth - dragState.initialWidth) / 2;
          } else if (handle === "e" || handle === "w") {
            // Mid handle scaling centers vertically relative to the anchor side
            newY =
              dragState.initialY - (newHeight - dragState.initialHeight) / 2;
          }

          if (handle.includes("w"))
            newX = dragState.initialX + (dragState.initialWidth - newWidth);
          if (handle.includes("n"))
            newY = dragState.initialY + (dragState.initialHeight - newHeight);
        } else {
          // Others (Text, Shapes): Free resizing
          if (handle.includes("e")) {
            newWidth = Math.max(20, dragState.initialWidth + dx);
          } else if (handle.includes("w")) {
            const deltaX = Math.min(dx, dragState.initialWidth - 20);
            newWidth = dragState.initialWidth - deltaX;
            newX = dragState.initialX + deltaX;
          }

          if (handle.includes("s")) {
            newHeight = Math.max(20, dragState.initialHeight + dy);
          } else if (handle.includes("n")) {
            const deltaY = Math.min(dy, dragState.initialHeight - 20);
            newHeight = dragState.initialHeight - deltaY;
            newY = dragState.initialY + deltaY;
          }
        }

        const updates: any = {
          size: { width: newWidth, height: newHeight },
          position: { x: newX, y: newY },
        };

        // Font scaling for text elements
        if (element.type === "text") {
          const heightRatio = newHeight / element.size.height;
          updates.fontSize = Math.round(
            (element as any).fontSize * heightRatio,
          );
        }

        throttledUpdateElement(currentPageId, dragState.id, updates);
      }
    },
    [
      dragState,
      currentPageId,
      zoom,
      allElements,
      throttledUpdateElement,
      TOTAL_WIDTH,
      TOTAL_HEIGHT,
      currentPage?.gridMode,
      currentPage?.gridLayout,
      throttledMoveToPage,
    ],
  );

  const handleMouseUp = () => {
    setDragState(null);
    setHoveredCell(null);
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

        const SYNC_INTERVAL_MS = 50; // Slightly higher for better performance

        const sync = () => {
          const state = useEditorStore.getState();
          const t = state.isPlaying
            ? state.playbackTimeRef.current
            : state.timelinePosition;
          const rawOffset = t - element.startTime;
          const naturalDuration = (element as any).naturalDuration;
          const trimStart = element.trim?.start || 0;
          const inRange = rawOffset >= 0 && rawOffset <= element.duration;
          const offset = naturalDuration
            ? (rawOffset % naturalDuration) + trimStart
            : rawOffset + trimStart;
          const clampedOffset = Math.max(0, offset);
          const volume = (element.volume ?? 100) / 100;

          el.muted = false;
          el.volume = Math.min(1, Math.max(0, volume));

          if (state.isPlaying) {
            if (inRange) {
              const diff = Math.abs(el.currentTime - clampedOffset);
              // Increased threshold to reduce unnecessary seeks
              if (el.paused || diff > 0.15) {
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
    },
  );
  AudioPlayer.displayName = "AudioPlayer";

  // Helper to draw elements to canvas (ONLY for export recording)
  React.useEffect(() => {
    const isExporting = document.body.classList.contains("export-in-progress");
    if (!isExporting) return;

    const canvas = document.getElementById(
      "editor-canvas",
    ) as HTMLCanvasElement;
    if (!canvas) return;

    const dims = getLayoutDimensions(currentPage || "16:9");
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
          timelinePosition <= el.startTime + el.duration,
      )
      .sort((a, b) => ((a as any).layer ?? 0) - ((b as any).layer ?? 0));

    visibleElements.forEach((el) => {
      ctx.save();
      const alpha = (el.opacity || 100) / 100;
      ctx.globalAlpha = alpha;

      const { x, y } = el.position;
      const { width, height } = el.size;

      // Draw background if exists
      if (
        (el as any).backgroundColor &&
        (el as any).backgroundColor !== "transparent"
      ) {
        ctx.fillStyle = (el as any).backgroundColor;
        if ((el as any).borderRadius) {
          const radius = parseInt((el as any).borderRadius);
          ctx.beginPath();
          ctx.roundRect(x, y, width, height, radius);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, width, height);
        }
      }

      if (el.type === "image" || el.type === "video") {
        const mediaTag = document.querySelector(
          `[data-element-id="${el.id}"] ${el.type}`,
        ) as HTMLImageElement | HTMLVideoElement;
        if (mediaTag) {
          try {
            const crop = el.crop || { x: 0, y: 0, width: 100, height: 100 };
            const nWidth =
              (mediaTag as HTMLVideoElement).videoWidth ||
              (mediaTag as HTMLImageElement).naturalWidth ||
              width;
            const nHeight =
              (mediaTag as HTMLVideoElement).videoHeight ||
              (mediaTag as HTMLImageElement).naturalHeight ||
              height;

            const sx = (crop.x / 100) * nWidth;
            const sy = (crop.y / 100) * nHeight;
            const sw = (crop.width / 100) * nWidth;
            const sh = (crop.height / 100) * nHeight;

            if ((el as any).borderRadius) {
              const radius = parseInt((el as any).borderRadius);
              ctx.beginPath();
              ctx.roundRect(x, y, width, height, radius);
              ctx.clip();
            }

            ctx.drawImage(mediaTag, sx, sy, sw, sh, x, y, width, height);
          } catch (e) {
            ctx.fillStyle = "#333";
            ctx.fillRect(x, y, width, height);
          }
        }
      } else if (el.type === "text") {
        const fontSize = (el as any).fontSize || 40;
        const color = (el as any).color || "#ffffff";
        const fontWeight = (el as any).fontWeight || "bold";
        const textAlign = (el as any).textAlign || "center";
        const fontFamily = (el as any).fontFamily || "Sans-Serif";
        const content = (el as any).content || "";
        const strokeWidth = (el as any).strokeWidth || 0;
        const strokeColor = (el as any).strokeColor || "#000000";

        ctx.fillStyle = color;
        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        ctx.textAlign = textAlign as CanvasTextAlign;
        ctx.textBaseline = "top";

        const lines = content.split("\n");
        const lineHeight = fontSize * 1.1;

        lines.forEach((line: string, index: number) => {
          let lx = x;
          const ly = y + index * lineHeight;

          if ((el as any).marquee) {
            const speed = (el as any).marqueeSpeed || 10;
            const duration = Math.max(1, speed);
            const elapsed = Math.max(0, timelinePosition - el.startTime);
            const progress = (elapsed % duration) / duration;
            const direction = (el as any).marqueeDirection || "left";

            // Marquee logic: Sync start at 0 (fully visible)
            const textWidthPx = ctx.measureText(line).width;
            const totalTravel = width + textWidthPx;
            const pStart = textWidthPx / totalTravel;

            let currentOffsetPx;
            if (direction === "left") {
              const p = (pStart + progress) % 1;
              currentOffsetPx = textWidthPx - p * totalTravel;
            } else {
              const p = (pStart - progress + 1) % 1;
              currentOffsetPx = textWidthPx - p * totalTravel;
            }

            lx = x + currentOffsetPx;
          } else {
            if (textAlign === "center") lx = x + width / 2;
            else if (textAlign === "right") lx = x + width;
          }

          // Draw stroke first if enabled
          if (strokeWidth > 0) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth * 2;
            ctx.lineJoin = "round";
            ctx.strokeText(line, lx, ly);
          }

          ctx.fillText(line, lx, ly);
        });
      } else if (el.type === "shape") {
        ctx.fillStyle = (el as any).color || "#3b82f6";
        ctx.strokeStyle = (el as any).color || "#3b82f6";
        ctx.lineWidth = 2;
        const shapeType = (el as any).shapeType;

        ctx.beginPath();
        if (shapeType === "Circle") {
          ctx.arc(
            x + width / 2,
            y + height / 2,
            Math.min(width, height) / 2,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        } else if (shapeType === "Square") {
          const radius = parseInt((el as any).borderRadius || "0");
          ctx.roundRect(x, y, width, height, radius);
          ctx.fill();
        } else if (shapeType === "Triangle") {
          ctx.moveTo(x + width / 2, y);
          ctx.lineTo(x + width, y + height);
          ctx.lineTo(x, y + height);
          ctx.closePath();
          ctx.fill();
        } else if (shapeType === "Star") {
          const cx = x + width / 2;
          const cy = y + height / 2;
          const outerRadius = Math.min(width, height) / 2;
          const innerRadius = outerRadius / 2.5;
          const spikes = 5;
          let rot = (Math.PI / 2) * 3;
          const step = Math.PI / spikes;

          ctx.moveTo(cx, cy - outerRadius);
          for (let i = 0; i < spikes; i++) {
            ctx.lineTo(
              cx + Math.cos(rot) * outerRadius,
              cy + Math.sin(rot) * outerRadius,
            );
            rot += step;
            ctx.lineTo(
              cx + Math.cos(rot) * innerRadius,
              cy + Math.sin(rot) * innerRadius,
            );
            rot += step;
          }
          ctx.lineTo(cx, cy - outerRadius);
          ctx.closePath();
          ctx.fill();
        } else if (shapeType === "Heart") {
          const cx = x + width / 2;
          const cy = y + height / 2.5;
          const d = Math.min(width, height);
          ctx.moveTo(cx, cy + d / 4);
          ctx.bezierCurveTo(cx, cy, cx - d / 2, cy, cx - d / 2, cy - d / 4);
          ctx.bezierCurveTo(
            cx - d / 2,
            cy - d / 2,
            cx,
            cy - d / 2,
            cx,
            cy - d / 4,
          );
          ctx.bezierCurveTo(
            cx,
            cy - d / 2,
            cx + d / 2,
            cy - d / 2,
            cx + d / 2,
            cy - d / 4,
          );
          ctx.bezierCurveTo(cx + d / 2, cy, cx, cy, cx, cy + d / 4);
          ctx.fill();
        } else {
          // Fallback for complex icons (Simple placeholder)
          ctx.roundRect(x, y, width, height, 5);
          ctx.stroke();
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = "12px Sans-Serif";
          ctx.fillText(shapeType, x + width / 2, y + height / 2);
        }
      }
      ctx.restore();
    });
  }, [timelinePosition, allElements, currentPage?.layout]);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const data = e.dataTransfer.getData("application/json");
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

      let finalX = x - 100;
      let finalY = y - 75;
      let finalSize = { width: 200, height: 150 };
      let gridCell = null;

      // Snap to grid if enabled
      if (currentPage?.gridMode && currentPage?.gridLayout) {
        const snapped = snapToCell(
          x,
          y,
          TOTAL_WIDTH,
          TOTAL_HEIGHT,
          currentPage.gridLayout,
        );
        if (snapped) {
          finalX = snapped.x;
          finalY = snapped.y;
          finalSize = { width: snapped.width, height: snapped.height };
          gridCell = {
            cellId: snapped.cell.id,
            col: snapped.cell.col,
            row: snapped.cell.row,
          };
        }
      }

      const newElement: any = {
        id: generateElementId(),
        type: asset.type,
        name: asset.name || asset.label,
        position: { x: finalX, y: finalY },
        size: finalSize,
        gridCell,
        duration,
        startTime: timelinePosition,
        freePosition: !currentPage?.gridMode,
        opacity: 100,
        layer: 0,
      };

      const hasVisuals = allElements.some(
        (el) => el.type === "image" || el.type === "video",
      );
      const defaultFill = hasVisuals ? "fill" : "fit";

      if (asset.type === "image") {
        newElement.src = asset.url || asset.src;
        newElement.fill = defaultFill;
        if (!gridCell) {
          newElement.size = { width: 400, height: 300 };
        }
      } else if (asset.type === "video") {
        newElement.src = asset.url || asset.src;
        newElement.thumbnail = asset.thumbnail;
        newElement.volume = 75;
        newElement.fill = defaultFill;
        if (!gridCell) {
          newElement.size = { width: 320, height: 180 };
        }
        newElement.naturalDuration = duration;
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
        newElement.naturalDuration = duration;
      }

      useEditorStore.getState().addElement(currentPageId, newElement);
    } catch (err) {
      console.error("Drop failed:", err);
    }
  };

  return (
    <div
      className={cn(
        "w-full h-full flex flex-col items-center justify-center bg-[#111114] overflow-auto relative",
        isFullscreen ? "p-0" : "p-8",
      )}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDragOver={(e) => e.preventDefault()}
      onWheel={(e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const delta = e.deltaY > 0 ? -5 : 5;
          useEditorStore.getState().setZoom(zoom + delta);
        }
      }}
    >
      {/* Grid Toggle Button - Top Left */}
      <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
        <button
          onClick={() => setShowLayoutSelector(true)}
          className={cn(
            "h-10 rounded-lg border-2 transition-all flex items-center justify-center shadow-lg backdrop-blur-md px-3 gap-2",
            currentPage?.gridMode && currentPage?.gridLayout?.id !== "single"
              ? "bg-[#5956E8] border-[#5956E8] text-white min-w-12"
              : "bg-white/80 border-white/20 text-gray-600 hover:border-[#5956E8] hover:text-[#5956E8] w-10 px-0",
          )}
          title="Change Grid Layout"
        >
          {currentPage?.gridMode &&
          currentPage?.gridLayout &&
          currentPage.gridLayout.id !== "single" ? (
            <span className="text-[10px] font-bold uppercase whitespace-nowrap">
              {currentPage.gridLayout.type === "2col"
                ? "2 COL"
                : currentPage.gridLayout.type === "3col"
                  ? "3 COL"
                  : currentPage.gridLayout.type === "2row"
                    ? "2 ROW"
                    : currentPage.gridLayout.type === "sidebar-left"
                      ? "SIDE L"
                      : currentPage.gridLayout.type === "sidebar-right"
                        ? "SIDE R"
                        : currentPage.gridLayout.type === "header-2col"
                          ? "HEAD 2"
                          : currentPage.gridLayout.type === "header-footer"
                            ? "H + F"
                            : currentPage.gridLayout.name.replace("Grid ", "")}
            </span>
          ) : (
            <Grid3x3 className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Full Screen Player Controls */}
      {isFullscreen && (
        <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-[60] flex flex-col justify-end px-8 pb-8 animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto group">
          {/* Progress Bar */}
          <div
            className="w-full h-1 bg-white/20 rounded-full mb-4 cursor-pointer relative group/progress hover:h-1.5 transition-all"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const percent = (e.clientX - rect.left) / rect.width;
              setTimelinePosition(percent * (currentPage?.duration || 10));
            }}
          >
            {/* Progress Fill */}
            <div
              className="absolute top-0 left-0 h-full bg-accent rounded-full transition-all duration-75 ease-linear"
              style={{
                width: `${(timelinePosition / (currentPage?.duration || 10)) * 100}%`,
              }}
            />
            {/* Scrubber Knob (visible on hover) */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity"
              style={{
                left: `${(timelinePosition / (currentPage?.duration || 10)) * 100}%`,
                transform: `translate(-50%, -50%)`,
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-all"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              <div className="flex items-center gap-2 font-mono text-sm font-bold text-white select-none">
                <span>{formatTime(timelinePosition)}</span>
                <span className="text-white/50">/</span>
                <span className="text-white/50">
                  {formatTime(currentPage?.duration || 10)}
                </span>
              </div>
            </div>

            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white/10 text-white rounded-lg transition-colors"
              title="Exit Full Screen"
            >
              <Minimize className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Layout Selector Modal */}
      <LayoutSelector
        isOpen={showLayoutSelector}
        onClose={() => setShowLayoutSelector(false)}
        onSelectLayout={(layout) => {
          setPageGridLayout(currentPageId, layout);
          // If "Single" is selected, effectively turn off grid mode (no overlay)
          setGridMode(currentPageId, layout.id !== "single");
        }}
        currentLayout={currentPage?.gridLayout || null}
      />
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

        {/* Grid Overlay */}
        {currentPage?.gridMode && currentPage?.gridLayout && (
          <GridOverlay
            layout={currentPage.gridLayout}
            canvasWidth={TOTAL_WIDTH}
            canvasHeight={TOTAL_HEIGHT}
            hoveredCell={hoveredCell}
            onCellHover={setHoveredCell}
            onLayoutChange={(newLayout) => {
              if (currentPageId) setPageGridLayout(currentPageId, newLayout);
            }}
          />
        )}

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
            {sortedElements.map((element) => (
              <CanvasElement
                key={element.id}
                element={element}
                isSelected={element.id === selectedElementId}
                isDragging={dragState?.id === element.id}
                handleMouseDown={handleMouseDown}
                setEditingElementId={setEditingElementId}
                editingElementId={editingElementId}
                timelinePosition={timelinePosition}
                isPlaying={isPlaying}
                updateElement={updateElement}
                currentPageId={currentPageId}
                isObscuring={obscuringIds.has(element.id)}
              />
            ))}
          </div>
        )}

        {/* Focus lines */}
        <div className="absolute inset-0 pointer-events-none border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Canvas Controls removed - relocated to Timeline header */}
    </div>
  );
}
