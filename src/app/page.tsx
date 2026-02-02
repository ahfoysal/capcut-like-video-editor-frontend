"use client";
import React, { useState } from "react";
import { TopNav } from "@/components/TopNav";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/Sidebar";
import { AssetLibrary } from "@/components/AssetLibrary";
import { EmptyState } from "@/components/EmptyState";
import { useEditorStore } from "@/store/editorStore";
import { Timeline } from "@/components/Timeline";
import { EditorCanvas } from "@/components/EditorCanvas";
import { PropertiesPanel } from "@/components/PropertiesPanel";
import { ProjectList } from "@/components/ProjectList";
import { useAutoSave } from "@/hooks/useAutoSave";

export default function Home() {
  const [activeTab, setActiveTab] = useState<
    "upload" | "elements" | "text" | "media" | "live" | "more" | "layers"
  >("upload");
  const {
    viewMode,
    timelineHeightMode,
    timelineHeight,
    isTimelineResizing,
    isFullscreen,
    showLeftSidebar,
    showRightSidebar,
  } = useEditorStore();

  // Enable Auto-Save
  useAutoSave(2000);

  if (viewMode === "home") {
    return <ProjectList />;
  }

  if (viewMode === "empty") {
    return <EmptyState />;
  }

  return (
    <main className="flex flex-col h-screen w-screen bg-bg-app overflow-hidden">
      {!isFullscreen && <TopNav />}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {!isFullscreen && showLeftSidebar && (
          <div className="shrink-0 z-20 h-full">
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        )}

        {/* Asset Library */}
        {!isFullscreen && showLeftSidebar && (
          <div className="shrink-0 hidden lg:block z-10 h-full border-r border-border">
            <AssetLibrary activeTab={activeTab} />
          </div>
        )}

        {/* Canvas Area */}
        <div className="flex-1 bg-[#111114] relative flex items-center justify-center overflow-hidden">
          <EditorCanvas />
        </div>

        {/* Properties Panel */}
        {!isFullscreen && showRightSidebar && (
          <div className="shrink-0 hidden xl:block h-full">
            <PropertiesPanel />
          </div>
        )}
      </div>

      {/* Bottom Timeline */}
      {!isFullscreen && (
        <div
          className={cn(
            "shrink-0 z-40 transition-[height] duration-300",
            isTimelineResizing && "transition-none",
          )}
          style={{
            height:
              timelineHeightMode === "small"
                ? 56
                : timelineHeightMode === "big"
                  ? 450
                  : timelineHeight,
          }}
        >
          <Timeline />
        </div>
      )}
    </main>
  );
}
