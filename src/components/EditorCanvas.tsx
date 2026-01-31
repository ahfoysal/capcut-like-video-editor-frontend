import React from "react";
import { cn, formatTimeShort } from "@/lib/utils";
import {
  Image as ImageIcon,
  Type,
  Video,
  Layers,
  Sparkles,
  Search,
} from "lucide-react";
import { useEditorStore } from "@/store/editorStore";

interface EditorCanvasProps {
  isEmpty?: boolean;
}

export function EditorCanvas({ isEmpty = true }: EditorCanvasProps) {
  const {
    pages,
    currentPageId,
    selectedElementId,
    setSelectedElement,
    updateElement,
    timelinePosition,
    isPlaying,
    zoom,
  } = useEditorStore();

  const currentPage = pages.find((p) => p.id === currentPageId);
  const allElements = currentPage?.elements || [];

  // Filter elements that should be visible at the current playhead
  const elements = allElements.filter(
    (el) =>
      timelinePosition >= el.startTime &&
      timelinePosition <= el.startTime + el.duration,
  );

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
    type: "move" | "resize",
  ) => {
    e.stopPropagation();
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

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState || !currentPageId) return;

    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;

    const element = elements.find((el) => el.id === dragState.id);
    if (!element) return;

    if (dragState.type === "move") {
      updateElement(currentPageId, dragState.id, {
        position: {
          x: dragState.initialX + dx,
          y: dragState.initialY + dy,
        },
      });
    } else if (dragState.type === "resize") {
      updateElement(currentPageId, dragState.id, {
        size: {
          width: Math.max(20, element.size.width + dx),
          height: Math.max(20, element.size.height + dy),
        },
      });
      // Update start positions to handle continuous resizing
      setDragState({
        ...dragState,
        startX: e.clientX,
        startY: e.clientY,
      });
    }
  };

  const handleMouseUp = () => {
    setDragState(null);
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ["INPUT", "TEXTAREA"].includes(
        (e.target as HTMLElement).tagName,
      );
      if (isInput) return;

      const { undo, redo, deleteElement, selectedElementId, currentPageId } =
        useEditorStore.getState();

      // Delete/Backspace
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedElementId &&
        currentPageId
      ) {
        e.preventDefault();
        deleteElement(currentPageId, selectedElementId);
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
  }, []); // Remove dependencies to avoid multiple listeners, use getState inside

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const asset = JSON.parse(e.dataTransfer.getData("application/json"));
      if (!currentPageId) return;

      const scale = zoom / 100;
      const rect = e.currentTarget.getBoundingClientRect();
      // Adjust for scale: the coordinates inside the transformed element
      // need to be mapped back to the 1:1 coordinate space.
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;

      const newElement: any = {
        id: `el-${Date.now()}`,
        type: asset.type,
        name: asset.name || asset.label,
        position: { x: x - 100, y: y - 75 },
        size: { width: 200, height: 150 },
        duration: 5,
        startTime: timelinePosition, // Add at current playhead
        freePosition: true,
        opacity: 100,
        layer: Date.now(),
      };

      if (asset.type === "image") {
        newElement.src = asset.url || asset.src;
        newElement.fill = "fill";
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
        newElement.content = asset.content || "Double click to edit";
        newElement.fontSize = asset.fontSize || 32;
        newElement.fontWeight = asset.fontWeight || "bold";
        newElement.color = asset.color || "#ffffff";
        newElement.backgroundColor = asset.backgroundColor || "transparent";
        newElement.size = { width: 300, height: 60 };
      }

      useEditorStore.getState().addElement(currentPageId, newElement);
    } catch (err) {
      console.error("Drop failed:", err);
    }
  };

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center p-8 bg-[#111114] overflow-hidden relative"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Canvas Container */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center" }}
        className="relative shadow-2xl bg-black aspect-video h-[85%] max-h-150 border border-border/50 rounded-sm overflow-hidden group transition-all duration-300"
      >
        {isEmpty && elements.length === 0 ? (
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
            {elements.map((element) => {
              const isSelected = element.id === selectedElementId;

              return (
                <div
                  key={element.id}
                  onMouseDown={(e) => handleMouseDown(e, element, "move")}
                  className={cn(
                    "absolute select-none group/el",
                    isSelected && "ring-[3px] ring-white z-50",
                  )}
                  style={{
                    left: `${element.position.x}px`,
                    top: `${element.position.y}px`,
                    width: `${element.size.width}px`,
                    height: `${element.size.height}px`,
                    zIndex: isSelected ? 100 : ((element as any).layer ?? 0),
                  }}
                >
                  {element.type === "image" && (
                    <div
                      className="w-full h-full relative overflow-hidden"
                      style={{
                        backgroundColor: (element as any).backgroundColor,
                        borderRadius: (element as any).borderRadius || "0px",
                        opacity: ((element as any).opacity ?? 100) / 100,
                      }}
                    >
                      {(element as any).src && (
                        <img
                          src={(element as any).src}
                          alt={element.name}
                          className="w-full h-full object-cover pointer-events-none"
                        />
                      )}
                    </div>
                  )}

                  {/* Inserted Canvas Element */}
                  {/* Assuming canvasRef and other props are defined elsewhere in the component scope */}
                  <canvas
                    id="editor-canvas"
                    // ref={canvasRef} // Uncomment and define canvasRef if needed
                    width={1920}
                    height={1080}
                    className="w-full h-full object-contain shadow-2xl bg-black rounded-lg"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                  />

                  {element.type === "video" && (
                    <div
                      className="w-full h-full bg-black relative overflow-hidden"
                      style={{
                        opacity: ((element as any).opacity ?? 100) / 100,
                        borderRadius: (element as any).borderRadius || "0px",
                      }}
                    >
                      <video
                        src={(element as any).src}
                        className="w-full h-full object-cover"
                        ref={(el) => {
                          if (el) {
                            const offset = timelinePosition - element.startTime;
                            if (Math.abs(el.currentTime - offset) > 0.1) {
                              el.currentTime = offset;
                            }
                            if (isPlaying && el.paused)
                              el.play().catch(() => {});
                            else if (!isPlaying && !el.paused) el.pause();
                          }
                        }}
                        muted
                        playsInline
                      />
                    </div>
                  )}

                  {element.type === "audio" && isPlaying && (
                    <audio
                      src={(element as any).src}
                      ref={(el) => {
                        if (el) {
                          const offset = timelinePosition - element.startTime;
                          if (Math.abs(el.currentTime - offset) > 0.1) {
                            el.currentTime = offset;
                          }
                          el.play().catch(() => {});
                        }
                      }}
                      autoPlay
                    />
                  )}

                  {element.type === "text" && (
                    <div
                      className="w-full h-full pointer-events-none flex items-center justify-center break-words px-2 text-center"
                      style={{
                        fontSize: `${(element as any).fontSize}px`,
                        fontWeight: (element as any).fontWeight,
                        color: (element as any).color || "#ffffff",
                        backgroundColor:
                          (element as any).backgroundColor || "transparent",
                        opacity: ((element as any).opacity ?? 100) / 100,
                        textAlign: (element as any).textAlign || "center",
                        lineHeight: 1.2,
                        borderRadius: (element as any).borderRadius || "0px",
                      }}
                    >
                      {(element as any).content}
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
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-full h-full"
                      >
                        {(element as any).shapeType === "Square" && (
                          <rect
                            x="3"
                            y="3"
                            width="18"
                            height="18"
                            rx="2"
                            ry="2"
                          />
                        )}
                        {(element as any).shapeType === "Circle" && (
                          <circle cx="12" cy="12" r="10" />
                        )}
                        {(element as any).shapeType === "Triangle" && (
                          <path d="M3 20h18L12 4z" />
                        )}
                        {(element as any).shapeType === "Star" && (
                          <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        )}
                        {(element as any).shapeType === "Heart" && (
                          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                        )}
                        {(element as any).shapeType === "Rocket" && (
                          <path d="M4.5 16.5c-1.5 1.26-2 2.67-2 4.5 0 0 0 0 0 0s0 0 0 0c1.83 0 3.24-.5 4.5-2L4.5 16.5Z M12 15-3-3 m1.31-7.11A18.004 18.004 0 0 1 21 3a18.004 18.004 0 0 1-2.11 10.69 M14.23 21a18.004 18.004 0 0 1-10.69 2.11 A18.004 18.004 0 0 1 3 12.42" />
                        )}
                        {(element as any).shapeType === "Smile" && (
                          <>
                            <circle cx="12" cy="12" r="10" />
                            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                            <line x1="9" y1="9" x2="9.01" y2="9" />
                            <line x1="15" y1="9" x2="15.01" y2="9" />
                          </>
                        )}
                        {(element as any).shapeType === "Zap" && (
                          <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
                        )}
                        {(element as any).shapeType === "Sparkle" && (
                          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
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
                        onMouseDown={(e) =>
                          handleMouseDown(e, element, "resize")
                        }
                      />
                    </>
                  )}
                </div>
              );
            })}
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
          <span>{currentPage?.layout || "1920x1080"}</span>
        </div>
      </div>
    </div>
  );
}
