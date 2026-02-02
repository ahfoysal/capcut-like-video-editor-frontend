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
  PanelLeft,
  PanelRight,
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
    showLeftSidebar,
    showRightSidebar,
    toggleLeftSidebar,
    toggleRightSidebar,
  } = useEditorStore();

  const currentPage = pages.find((p) => p.id === currentPageId);

  const [isExportOpen, setIsExportOpen] = React.useState(false);

  return (
    <>
      <div className="h-16 w-full bg-[#111114]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-6 justify-between shrink-0 z-50 sticky top-0">
        {/* Left Section: Back, Title, Project name & save status */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => useEditorStore.getState().setViewMode("home")}
            className="p-2 hover:bg-white/5 rounded-full text-zinc-400 hover:text-white transition-all active:scale-90"
            title="Go to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center border-r border-white/10 pr-6 h-8 gap-4">
            <button
              onClick={toggleLeftSidebar}
              className={`p-2 rounded-lg transition-all ${
                showLeftSidebar
                  ? "text-white bg-[#5956E8]"
                  : "text-zinc-400 hover:bg-white/5"
              }`}
              title={showLeftSidebar ? "Hide Sidebar" : "Show Sidebar"}
            >
              <PanelLeft className="w-4.5 h-4.5" />
            </button>
            <div className="flex flex-col">
              <span className="font-bold text-sm leading-none tracking-tight text-white uppercase opacity-90">
                Softvence
              </span>
              <span className="text-[10px] text-[#5956E8] font-black uppercase tracking-widest mt-0.5">
                Omega
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 group relative ml-2">
            <div className="flex flex-col">
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="bg-transparent border-none outline-none text-zinc-100 text-[13px] font-semibold focus:ring-0 p-0 w-fit min-w-[150px] transition-all placeholder:text-zinc-600"
                placeholder="Untitled Project"
              />
              <div className="flex items-center gap-2 mt-0.5">
                {saveStatus === "saving" && (
                  <div className="flex items-center gap-1.5 animate-pulse">
                    <Loader2 className="w-2.5 h-2.5 text-zinc-500 animate-spin" />
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.1em]">
                      Syncing...
                    </span>
                  </div>
                )}
                {saveStatus === "saved" && (
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.1em]">
                      Cloud Saved
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-l border-white/10 pl-6 h-8">
          <select
            value={currentPage?.layout || "16:9"}
            onChange={(e) => {
              if (currentPageId) {
                updatePage(currentPageId, { layout: e.target.value as any });
              }
            }}
            className="bg-zinc-800/50 border border-white/5 rounded-md px-3 py-1 text-[11px] font-bold text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#5956E8]/50 hover:bg-zinc-800 transition-colors cursor-pointer appearance-none"
          >
            <option value="1:1">1:1 Square</option>
            <option value="16:9">16:9 Landscape</option>
            <option value="9:16">9:16 Portrait</option>
            <option value="4:5">4:5 Social</option>
            <option value="2:3">2:3 Story</option>
          </select>
        </div>

        {/* Center Section: Zoom & Undo/Redo */}
        <div className="flex-1 flex items-center justify-center gap-8">
          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              disabled={history.length === 0}
              className="p-2 hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed rounded-full transition-all text-zinc-400 hover:text-white"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={redo}
              disabled={future.length === 0}
              className="p-2 hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed rounded-full transition-all text-zinc-400 hover:text-white"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-4.5 h-4.5" />
            </button>
          </div>

          <div className="flex items-center bg-zinc-800/40 border border-white/5 rounded-full p-1 pl-4 pr-1 gap-2 shadow-inner">
            <span className="text-[11px] font-black text-zinc-400 tracking-tighter w-8 text-center">
              {zoom}%
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoom(zoom - 10)}
                className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded-full transition-all text-zinc-400 hover:text-white"
              >
                <Minus className="w-3 h-3" />
              </button>
              <button
                onClick={() => setZoom(zoom + 10)}
                className="w-6 h-6 flex items-center justify-center bg-zinc-700/50 hover:bg-zinc-600 rounded-full transition-all text-white border border-white/10"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Section: Actions, Mode */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 mr-2">
            <button className="p-2 hover:bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors">
              <Moon className="w-5 h-5" />
            </button>
            <button
              onClick={toggleRightSidebar}
              className={`p-2 rounded-full transition-all ${
                showRightSidebar
                  ? "text-[#5956E8] bg-[#5956E8]/10"
                  : "text-zinc-400 hover:bg-white/5"
              }`}
              title={showRightSidebar ? "Hide Properties" : "Show Properties"}
            >
              <PanelRight className="w-4.5 h-4.5" />
            </button>
          </div>

          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-2 bg-[#5956E8] text-white hover:bg-[#6c69ff] px-6 py-2 rounded-full font-bold text-[13px] transition-all shadow-lg active:scale-95 group"
          >
            <Sparkles className="w-4 h-4 text-white group-hover:animate-pulse" />
            <span>Produce</span>
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
