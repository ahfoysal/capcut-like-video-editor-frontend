import React from "react";
import {
  ArrowLeft,
  Minus,
  Plus,
  Undo2,
  Redo2,
  Moon,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useEditorStore } from "@/store/editorStore";

import { ExportModal } from "./ExportModal";

export function TopNav() {
  const {
    projectName,
    zoom,
    setZoom,
    future,
    currentPageId,
    pages,
    updatePage,
    saveStatus,
    undo,
    redo,
    history,
    setProjectName,
  } = useEditorStore();

  const currentPage = pages.find((p) => p.id === currentPageId);

  const [isExportOpen, setIsExportOpen] = React.useState(false);

  return (
    <>
      <div className="h-18 w-full bg-bg-app border-b border-border flex items-center px-5 justify-between shrink-0 z-50">
        {/* Left Section: Back, Title, Project name & save status */}
        <div className="flex items-center gap-5">
          <button
            onClick={() => useEditorStore.getState().setViewMode("home")}
            className="p-2 hover:bg-white/5 rounded-full text-text-muted hover:text-white transition-all"
            title="Go to Home"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center border-r border-border pr-5 h-6">
            <span className="font-bold text-lg leading-none tracking-tight text-white">
              CapCut Editor
            </span>
          </div>

          <div className="flex items-center gap-2 group relative">
            <input
              type="text"
              value={projectName}
              onChange={(e) =>
                useEditorStore.getState().setProjectName(e.target.value)
              }
              className="bg-transparent border-none outline-none text-text-main text-sm font-bold focus:ring-1 focus:ring-accent/30 rounded px-1 -ml-1 w-fit min-w-[120px] transition-all"
              placeholder="Project Name"
            />
            {saveStatus === "saving" && (
              <div className="flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 text-text-muted animate-spin" />
                <span className="text-[10px] text-text-muted font-mono uppercase tracking-widest">
                  Saving...
                </span>
              </div>
            )}
            {saveStatus === "saved" && (
              <span className="text-[10px] text-accent font-bold uppercase tracking-widest">
                SAVED
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 border-l border-border pl-5">
          <select
            value={currentPage?.layout || "16:9"}
            onChange={(e) => {
              console.log("Changing layout to:", e.target.value);
              if (currentPageId) {
                updatePage(currentPageId, { layout: e.target.value as any });
              }
            }}
            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] font-bold text-text-main focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="1:1">1:1 (Square)</option>
            <option value="16:9">16:9 (Landscape)</option>
            <option value="9:16">9:16 (Portrait)</option>
            <option value="4:5">4:5 (Post)</option>
            <option value="2:3">2:3 (Stories)</option>
          </select>
        </div>

        {/* Center Section: Zoom Controls */}
        <div className="flex-1 flex items-center justify-center gap-4">
          <div className="flex items-center bg-secondary/20 border border-border rounded-lg p-0.5">
            <button
              onClick={() => setZoom(zoom - 10)}
              className="p-1.5 hover:bg-white/10 rounded-md transition-all text-text-muted hover:text-text-main"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-3 text-[12px] font-bold min-w-12 text-center text-text-main">
              {zoom}%
            </span>
            <button
              onClick={() => setZoom(zoom + 10)}
              className="p-1.5 hover:bg-white/10 rounded-md transition-all text-text-muted hover:text-text-main"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1 ml-4 border-l border-border pl-4">
            <button
              onClick={undo}
              disabled={history.length === 0}
              className="p-2 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed rounded-full transition-colors text-text-muted hover:text-text-main"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-5 h-5" />
            </button>
            <button
              onClick={redo}
              disabled={future.length === 0}
              className="p-2 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed rounded-full transition-colors text-text-muted hover:text-text-main"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right Section: Actions, Mode */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-2 bg-accent text-black hover:bg-cyan-300 px-5 py-2 rounded-lg font-bold text-sm transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] active:scale-95"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            Export
          </button>

          <button className="p-2 hover:bg-white/5 rounded-full text-text-muted hover:text-text-main transition-colors">
            <Moon className="w-5 h-5 fill-current" />
          </button>
        </div>
      </div>

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </>
  );
}
