import React from "react";
import {
  ArrowLeft,
  Minus,
  Plus,
  Undo2,
  Redo2,
  Moon,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useEditorStore } from "@/store/editorStore";

import { ExportModal } from "./ExportModal";

export function TopNav() {
  const {
    projectName,
    zoom,
    setZoom,
    saveProject,
    saveStatus,
    resetProject,
    undo,
    redo,
    history,
    future,
  } = useEditorStore();

  const [isExportOpen, setIsExportOpen] = React.useState(false);

  const handleUpdate = async () => {
    await saveProject();
  };

  const handleNewProject = () => {
    if (
      window.confirm(
        "Are you sure you want to start a new project? This will clear current changes.",
      )
    ) {
      resetProject();
    }
  };

  return (
    <>
      <div className="h-18 w-full bg-bg-app border-b border-border flex items-center px-5 justify-between shrink-0 z-50">
        {/* Left Section: Back, Title, New */}
        <div className="flex items-center gap-5">
          <button
            onClick={handleNewProject}
            title="New Project"
            className="flex items-center gap-2 text-text-muted hover:text-white transition-all bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/5"
          >
            <Plus className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              New Project
            </span>
          </button>

          <div className="flex items-center border-r border-border pr-5 h-6">
            <span className="font-bold text-lg leading-none tracking-tight">
              CapCut Editor
            </span>
          </div>

          <div className="flex items-center gap-2 text-text-main text-sm font-medium">
            {projectName}
            {saveStatus === "saving" && (
              <span className="text-[10px] text-text-muted animate-pulse font-mono uppercase tracking-widest">
                Saving...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="text-[10px] text-accent font-bold uppercase tracking-widest">
                SAVED
              </span>
            )}
          </div>
        </div>

        {/* Center Section: Zoom Controls */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4 bg-bg-app">
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

          <button
            onClick={handleUpdate}
            disabled={saveStatus === "saving"}
            className="bg-white/10 text-white hover:bg-white/20 border border-white/10 px-6 py-2 rounded-lg font-bold text-sm transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            {saveStatus === "saving" ? "Updating..." : "Update"}
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
