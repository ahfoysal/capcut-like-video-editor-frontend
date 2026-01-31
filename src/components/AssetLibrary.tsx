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
  } = useEditorStore();

  const [loading, setLoading] = useState(true);

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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      await uploadAsset(file);
    } catch (error) {
      console.error("Error uploading asset:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    let items = [];
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
      case "media":
        items = testMedia;
        title = "Cloud Media";
        break;
      case "layers":
        title = "Layers Management";
        // Sort elements by layer (descending for top-to-bottom list)
        const sortedLayers = [...elements].sort(
          (a, b) => ((b as any).layer || 0) - ((a as any).layer || 0),
        );

        return (
          <div className="flex-1 overflow-y-auto p-4 no-scrollbar space-y-2">
            <h3 className="text-[10px] font-bold text-text-muted mb-4 uppercase tracking-[0.15em]">
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
                    "flex items-center justify-between p-3 bg-secondary/10 border rounded-xl group transition-all cursor-pointer",
                    selectedElementId === el.id
                      ? "border-accent ring-1 ring-accent"
                      : "border-border hover:border-white/20",
                  )}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center border border-white/5">
                      {el.type === "text" && (
                        <Type size={14} className="text-white/60" />
                      )}
                      {el.type === "image" && (
                        <ImageIcon size={14} className="text-white/60" />
                      )}
                      {el.type === "video" && (
                        <Video size={14} className="text-white/60" />
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
                      className="p-1.5 hover:bg-white/10 rounded-md text-text-muted hover:text-white"
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
                      className="p-1.5 hover:bg-white/10 rounded-md text-text-muted hover:text-white"
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
        <div className="grid grid-cols-2 gap-3">
          {items.map((item: any) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(
                  "application/json",
                  JSON.stringify(item),
                );
              }}
              className="group cursor-pointer animate-in fade-in zoom-in duration-300"
            >
              <div className="relative rounded-xl overflow-hidden border border-border bg-secondary/10 aspect-square flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:border-white/20 transition-all">
                {item.icon ? (
                  <div style={{ color: item.color }} className="drop-shadow-sm">
                    <item.icon size={28} strokeWidth={2.5} />
                  </div>
                ) : item.type === "text" ? (
                  <div className="flex flex-col items-center px-2 text-center">
                    <span className="text-[11px] font-bold text-text-main leading-tight mb-1 truncate w-full">
                      {item.content}
                    </span>
                    <div className="h-0.5 w-4 bg-accent/40 rounded-full" />
                  </div>
                ) : (
                  <img
                    src={
                      item.url &&
                      !item.url.startsWith("/") &&
                      !item.url.startsWith("http")
                        ? item.url
                        : item.url
                          ? item.url.startsWith("http")
                            ? item.url
                            : `http://localhost:3001${item.url}`
                          : item.thumbnail || item.src
                    }
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                )}
                {item.type === "video" && (
                  <div className="absolute top-1 right-1 bg-black/70 text-white text-[8px] px-1.5 py-0.5 rounded-sm font-bold backdrop-blur-md border border-white/10 uppercase tracking-tighter">
                    VIDEO
                  </div>
                )}
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
              </div>
              <p className="mt-1.5 text-[10px] font-medium text-text-muted truncate px-1 group-hover:text-text-main transition-colors">
                {item.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-70 h-full bg-bg-app flex flex-col border-r border-border animate-in slide-in-from-left duration-500">
      <div className="p-4 border-b border-border space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-main tracking-tight">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h2>
          {activeTab === "upload" && (
            <label className="cursor-pointer p-2 hover:bg-white/5 text-text-main rounded-xl transition-all active:scale-90 group relative">
              <Upload size={18} />
              <input type="file" className="hidden" onChange={handleUpload} />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                Upload
              </span>
            </label>
          )}
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-text-main transition-colors" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            className="w-full pl-9 pr-3 py-2 bg-secondary/20 border border-border rounded-xl text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:bg-secondary/30 focus:border-white/10 focus:ring-4 focus:ring-white/5 transition-all font-medium"
          />
        </div>
      </div>

      {loading && activeTab === "upload" ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-muted space-y-3">
          <div className="w-10 h-10 border-4 border-white/5 border-t-white rounded-full animate-spin" />
          <p className="text-sm font-bold animate-pulse text-text-main">
            Syncing assets...
          </p>
        </div>
      ) : (
        renderContent()
      )}
    </div>
  );
}
