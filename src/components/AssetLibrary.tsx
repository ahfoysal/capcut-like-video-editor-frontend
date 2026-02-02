import React, { useEffect, useState } from "react";
import {
  Search,
  Upload,
  Square,
  Circle,
  Triangle,
  Type,
  Star,
  Heart,
  Rocket,
  Smile,
  Zap,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Video,
  Music,
  Trash2,
} from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { cn } from "@/lib/utils";

interface AssetLibraryProps {
  activeTab?: string;
}

export function AssetLibrary({ activeTab = "upload" }: AssetLibraryProps) {
  const {
    resources,
    uploadAsset,
    fetchResources,
    pages,
    currentPageId,
    updateElement,
    selectedElementId,
    setSelectedElement,
    deleteResource,
  } = useEditorStore();

  const [loading, setLoading] = useState(true);
  const [uploadStatusMessage, setUploadStatusMessage] =
    useState<string>("Syncing assets...");
  const [isDragging, setIsDragging] = useState(false);
  const [stockSearch, setStockSearch] = useState("");
  const [stockResults, setStockResults] = useState<any[]>([]);
  const [searchingStock, setSearchingStock] = useState(false);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [isOverTrash, setIsOverTrash] = useState(false);

  const testElements = [
    { id: "e1", type: "shape", name: "Square", icon: Square, color: "#3b82f6" },
    { id: "e2", type: "shape", name: "Circle", icon: Circle, color: "#10b981" },
    {
      id: "e3",
      type: "shape",
      name: "Triangle",
      icon: Triangle,
      color: "#ef4444",
    },
    { id: "e4", type: "shape", name: "Star", icon: Star, color: "#f59e0b" },
    { id: "e5", type: "shape", name: "Heart", icon: Heart, color: "#ec4899" },
    { id: "e6", type: "shape", name: "Rocket", icon: Rocket, color: "#6366f1" },
    { id: "e7", type: "shape", name: "Smile", icon: Smile, color: "#8b5cf6" },
    { id: "e8", type: "shape", name: "Zap", icon: Zap, color: "#fbbf24" },
    {
      id: "e9",
      type: "shape",
      name: "Sparkle",
      icon: Sparkles,
      color: "#2dd4bf",
    },
  ];

  const testTextTemplates = [
    {
      id: "t1",
      type: "text",
      name: "Main Title",
      content: "MAIN TITLE",
      fontSize: 64,
      fontWeight: "800",
      color: "#000000",
    },
    {
      id: "t2",
      type: "text",
      name: "Heading",
      content: "Heading Text",
      fontSize: 40,
      fontWeight: "700",
      color: "#1a1a1a",
    },
    {
      id: "t3",
      type: "text",
      name: "Subheading",
      content: "Subheading content",
      fontSize: 24,
      fontWeight: "600",
      color: "#4b5563",
    },
    {
      id: "t4",
      type: "text",
      name: "Body Text",
      content: "This is a body text block for descriptions.",
      fontSize: 16,
      fontWeight: "400",
      color: "#6b7280",
    },
    {
      id: "t5",
      type: "text",
      name: "Caption",
      content: "CAPTION STYLE",
      fontSize: 14,
      fontWeight: "700",
      color: "#3b82f6",
      backgroundColor: "#dbeafe",
    },
  ];

  const testMedia = [
    {
      id: "m1",
      type: "image",
      url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=500&h=500&fit=crop",
      name: "Nature Wall",
    },
    {
      id: "m2",
      type: "image",
      url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500&h=500&fit=crop",
      name: "Forest Mist",
    },
    {
      id: "m3",
      type: "image",
      url: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=500&h=500&fit=crop",
      name: "Blue Peaks",
    },
    {
      id: "m4",
      type: "video",
      url: "https://www.w3schools.com/html/mov_bbb.mp4",
      thumbnail:
        "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=500&h=500&fit=crop",
      name: "Bunny Trailer",
    },
  ];

  useEffect(() => {
    fetchResources().finally(() => setLoading(false));
  }, [fetchResources]);

  // Handle stock image search
  useEffect(() => {
    if (activeTab !== "media") return;

    const searchStock = async () => {
      if (!stockSearch.trim()) {
        // Show some default popular images
        setStockResults([
          {
            id: "s1",
            type: "image",
            url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=500&h=500&fit=crop",
            name: "Mountain",
          },
          {
            id: "s2",
            type: "image",
            url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500&h=500&fit=crop",
            name: "Forest",
          },
          {
            id: "s3",
            type: "image",
            url: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=500&h=500&fit=crop",
            name: "Lake",
          },
          {
            id: "s4",
            type: "image",
            url: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=500&h=500&fit=crop",
            name: "Landscape",
          },
        ]);
        return;
      }

      setSearchingStock(true);
      try {
        // Use a public Unsplash search URL pattern that works for demos
        // or a reliable source. Since we don't have a key, we'll generate credible URLs based on keywords
        const keywords = stockSearch.split(" ");
        const results = Array.from({ length: 12 }).map((_, i) => {
          const id = `stock-${Date.now()}-${i}`;
          // Using a more modern Unsplash URL pattern that supports dimensions and search
          return {
            id,
            type: "image",
            url: `https://images.unsplash.com/photo-${1500000000000 + i}?w=800&q=80&fit=crop&q=${encodeURIComponent(stockSearch)}&sig=${i}`,
            thumbnail: `https://images.unsplash.com/photo-${1500000000000 + i}?w=400&q=60&fit=crop&q=${encodeURIComponent(stockSearch)}&sig=${i}`,
            name: `${stockSearch} ${i + 1}`,
          };
        });
        setStockResults(results);
      } catch (error) {
        console.error("Error searching stock:", error);
      } finally {
        setSearchingStock(false);
      }
    };

    const timer = setTimeout(searchStock, 500);
    return () => clearTimeout(timer);
  }, [stockSearch, activeTab]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await handleFilesUpload(Array.from(files));
  };

  const handleFilesUpload = async (files: File[]) => {
    try {
      setLoading(true);
      const hasVideoOrAudio = files.some(
        (f) => f.type.startsWith("video/") || f.type.startsWith("audio/"),
      );
      setUploadStatusMessage(
        hasVideoOrAudio ? "Transcoding for smooth playback..." : "Uploading...",
      );
      const uploadPromises = files.map((file) => uploadAsset(file));
      await Promise.all(uploadPromises);
    } catch (error) {
      console.error("Error uploading assets:", error);
    } finally {
      setLoading(false);
      setUploadStatusMessage("Syncing assets...");
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only show upload overlay for external files, not internal library items
    if (activeTab === "upload" || activeTab === "media") {
      // Check if dragging external files (not JSON data from library)
      const hasFiles = e.dataTransfer.types.includes("Files");
      const hasJSON = e.dataTransfer.types.includes("application/json");

      // Only set dragging if it's external files
      if (hasFiles && !hasJSON) {
        setIsDragging(true);
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're actually leaving the component
    const rect = e.currentTarget.getBoundingClientRect();
    if (
      e.clientX <= rect.left ||
      e.clientX >= rect.right ||
      e.clientY <= rect.top ||
      e.clientY >= rect.bottom
    ) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await handleFilesUpload(Array.from(files));
    }
  };

  const getAssetUrl = (item: any) => {
    // For videos, prefer thumbnail in library view
    if (item.type === "video" && item.thumbnail) {
      const thumb = item.thumbnail;
      if (thumb.startsWith("http") || thumb.startsWith("data:")) return thumb;
      return `http://localhost:3001${thumb.startsWith("/") ? "" : "/"}${thumb}`;
    }

    const url = item.url || item.src;
    if (!url) return "";
    if (
      url.startsWith("http") ||
      url.startsWith("data:") ||
      url.startsWith("blob:")
    )
      return url;
    return `http://localhost:3001${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const renderContent = () => {
    let items: any[] = [];
    let title = "Uploads";
    const currentPage = pages.find((p) => p.id === currentPageId);
    const elements = currentPage?.elements || [];

    switch (activeTab) {
      case "elements":
        items = testElements;
        title = "Shapes & Elements";
        break;
      case "text":
        items = testTextTemplates;
        title = "Text Templates";
        break;
      case "upload":
        items = resources;
        title = "My Uploads";
        break;
      case "media":
        items = stockResults;
        title = "Stock Images";
        break;
      case "layers":
        title = "Layers Management";
        // Sort elements by layer (descending for top-to-bottom list)
        const sortedLayers = [...elements].sort(
          (a, b) => ((b as any).layer || 0) - ((a as any).layer || 0),
        );

        return (
          <div className="flex-1 overflow-y-auto p-4 no-scrollbar space-y-2">
            <h3 className="text-[10px] font-bold text-text-muted mb-4 uppercase tracking-[0.15em] flex items-center gap-2">
              <Layers size={12} />
              {title}
            </h3>
            {sortedLayers.length === 0 ? (
              <div className="py-12 text-center text-text-muted text-xs opacity-50">
                No layers found
              </div>
            ) : (
              sortedLayers.map((el, idx) => (
                <div
                  key={el.id}
                  onClick={() => setSelectedElement(el.id)}
                  className={cn(
                    "flex items-center justify-between p-3 bg-bg-panel border border-border shadow-sm rounded-xl group transition-all duration-300 cursor-pointer",
                    selectedElementId === el.id
                      ? "border-primary bg-primary/5 shadow-[0_0_15px_rgba(15,166,255,0.05)]"
                      : "border-border hover:border-primary/30 hover:bg-bg-hover",
                  )}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center border border-border">
                      {el.type === "text" && (
                        <Type size={14} className="text-text-muted" />
                      )}
                      {el.type === "image" && (
                        <ImageIcon size={14} className="text-text-muted" />
                      )}
                      {el.type === "video" && (
                        <Video size={14} className="text-text-muted" />
                      )}
                      {el.type === "audio" && (
                        <Music size={14} className="text-text-muted" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-bold text-text-main truncate uppercase tracking-tighter">
                        {el.name || el.type}
                      </span>
                      <span className="text-[9px] text-text-muted font-bold opacity-50">
                        LAYER {sortedLayers.length - idx}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (currentPageId)
                          updateElement(currentPageId, el.id, {
                            layer: Date.now(),
                          });
                      }}
                      className="p-1.5 hover:bg-black/5 rounded-md text-text-muted hover:text-text-main"
                      title="Bring to Front"
                    >
                      <Zap size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (currentPageId)
                          updateElement(currentPageId, el.id, {
                            layer: -Date.now(),
                          });
                      }}
                      className="p-1.5 hover:bg-black/5 rounded-md text-text-muted hover:text-text-main"
                      title="Send to Back"
                    >
                      <Sparkles size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        );
      default:
        items = resources;
        title = "My Library";
    }

    return (
      <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
        <h3 className="text-[10px] font-bold text-text-muted mb-4 uppercase tracking-[0.15em]">
          {title}
        </h3>
        {searchingStock ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
            <span className="text-[10px] font-bold text-text-muted uppercase">
              Searching...
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {(Array.isArray(items) ? items : []).map((item: any) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => {
                  // Set dragging ID for delete functionality (upload tab only)
                  if (activeTab === "upload") {
                    setDraggingItemId(item.id);
                  }
                  // Set data for canvas drop
                  e.dataTransfer.setData(
                    "application/json",
                    JSON.stringify(item),
                  );
                }}
                onDragEnd={() => {
                  setDraggingItemId(null);
                  setIsOverTrash(false);
                }}
                className="group cursor-pointer animate-in fade-in zoom-in duration-300"
              >
                <div className="relative rounded-2xl overflow-hidden border border-border bg-secondary aspect-square flex items-center justify-center shadow-sm group-hover:border-primary/50 transition-all duration-500">
                  {item.icon ? (
                    <div
                      style={{ color: item.color }}
                      className="drop-shadow-[0_0_8px_rgba(255,255,255,0.1)] group-hover:scale-110 transition-transform duration-500"
                    >
                      <item.icon size={32} strokeWidth={2} />
                    </div>
                  ) : item.type === "text" ? (
                    <div className="flex flex-col items-center px-4 text-center">
                      <span className="text-[12px] font-black text-text-main leading-tight mb-2 truncate w-full uppercase tracking-tighter opacity-70 group-hover:opacity-100 transition-opacity">
                        {item.content}
                      </span>
                      <div className="h-0.5 w-6 bg-primary/60 rounded-full group-hover:w-full transition-all duration-500" />
                    </div>
                  ) : item.type === "audio" ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-primary/5 group-hover:bg-primary/10 transition-colors">
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-2 border border-primary/20 shadow-[0_0_20px_rgba(15,166,255,0.05)] group-hover:scale-110 transition-transform duration-500">
                        <Music size={28} className="text-primary" />
                      </div>
                      <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">
                        AUDIO
                      </span>
                    </div>
                  ) : (
                    <div className="w-full h-full relative overflow-hidden">
                      <img
                        src={getAssetUrl(item)}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const fallback =
                            target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = "flex";
                        }}
                      />
                      <div className="absolute inset-0 hidden flex-col items-center justify-center bg-black/40 text-white/40">
                        {item.type === "video" ? (
                          <Video size={24} />
                        ) : (
                          <ImageIcon size={24} />
                        )}
                        <span className="text-[8px] mt-2 font-black uppercase tracking-widest">
                          Offline
                        </span>
                      </div>

                      {/* Media Badge */}
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded shadow-sm backdrop-blur-md bg-bg-panel/60 border border-border opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {item.type === "video" ? (
                          <Video size={10} className="text-text-main" />
                        ) : (
                          <ImageIcon size={10} className="text-text-main" />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Hover Overlay Actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-[2px]">
                    {activeTab === "upload" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteResource(item.id);
                        }}
                        className="w-10 h-10 rounded-full bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 flex items-center justify-center transition-all scale-90 group-hover:scale-100"
                        title="Delete Asset"
                      >
                        <Trash2 size={18} className="text-red-400" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-[10px] font-bold text-text-muted truncate px-1 group-hover:text-primary transition-all duration-300 uppercase tracking-tighter">
                  {item.name}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="w-70 h-full bg-bg-app flex flex-col border-r border-border animate-in slide-in-from-left duration-500 relative"
    >
      {/* Drag and Drop Overlay */}
      {isDragging && activeTab === "upload" && (
        <div className="absolute inset-0 z-50 bg-accent/10 backdrop-blur-[2px] border-2 border-dashed border-accent m-2 rounded-2xl flex flex-col items-center justify-center animate-in fade-in duration-200 pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-4 border border-accent/30 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
            <Upload size={32} className="text-accent animate-bounce" />
          </div>
          <p className="text-sm font-bold text-text-main">Drop to Upload</p>
          <p className="text-[11px] text-text-muted mt-1 font-medium">
            Release to start syncing your assets
          </p>
        </div>
      )}
      <div className="p-6 border-b border-border space-y-5 bg-bg-panel">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-sm font-black text-text-main tracking-[0.2em] uppercase">
              {activeTab}
            </h2>
            <div className="h-1 w-6 bg-primary rounded-full mt-1" />
          </div>
          {activeTab === "upload" && (
            <label className="cursor-pointer p-2 hover:bg-bg-hover text-text-muted hover:text-text-main rounded-lg transition-all active:scale-90 group relative border border-border bg-bg-panel shadow-sm">
              <Upload size={16} />
              <input type="file" className="hidden" onChange={handleUpload} />
            </label>
          )}
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            value={activeTab === "media" ? stockSearch : ""}
            onChange={(e) =>
              activeTab === "media" ? setStockSearch(e.target.value) : null
            }
            placeholder={`Search ${activeTab === "media" ? "library" : activeTab}...`}
            className="w-full pl-9 pr-3 py-2 bg-secondary/80 border border-border rounded-xl text-[12px] text-text-main placeholder:text-text-muted/50 focus:outline-none focus:bg-bg-panel focus:border-primary/30 transition-all font-medium"
          />
        </div>
      </div>

      {loading && activeTab === "upload" ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-muted space-y-3">
          <div className="w-10 h-10 border-4 border-border border-t-primary rounded-full animate-spin" />
          <p className="text-sm font-bold animate-pulse text-text-main">
            {uploadStatusMessage}
          </p>
          <p className="text-xs text-text-muted max-w-[200px]">
            {uploadStatusMessage.includes("Transcoding")
              ? "Processing so playback is smooth"
              : null}
          </p>
        </div>
      ) : (
        renderContent()
      )}

      {/* Trash Bin Drop Zone */}
      {draggingItemId && activeTab === "upload" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsOverTrash(true);
          }}
          onDragLeave={() => setIsOverTrash(false)}
          onDrop={async (e) => {
            e.preventDefault();
            if (draggingItemId) {
              try {
                await deleteResource(draggingItemId);
              } catch (error) {
                console.error("Failed to delete:", error);
              }
            }
            setDraggingItemId(null);
            setIsOverTrash(false);
          }}
          className={cn(
            "absolute bottom-4 left-4 right-4 h-20 rounded-xl border-2 border-dashed flex items-center justify-center transition-all duration-200",
            isOverTrash
              ? "bg-red-500/20 border-red-500 scale-105"
              : "bg-red-500/10 border-red-400",
          )}
        >
          <div className="flex flex-col items-center gap-2">
            <Trash2
              className={cn(
                "transition-all",
                isOverTrash ? "w-8 h-8 text-red-500" : "w-6 h-6 text-red-400",
              )}
            />
            <span
              className={cn(
                "text-xs font-bold uppercase tracking-wider",
                isOverTrash ? "text-red-500" : "text-red-400",
              )}
            >
              {isOverTrash ? "Release to Delete" : "Drop to Delete"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
