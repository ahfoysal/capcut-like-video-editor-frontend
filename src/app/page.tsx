"use client";
import React, { useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Sidebar } from "@/components/Sidebar";
import { AssetLibrary } from "@/components/AssetLibrary";
import { EmptyState } from "@/components/EmptyState";
import { useEditorStore } from "@/store/editorStore";
import { Timeline } from "@/components/Timeline";
import { EditorCanvas } from "@/components/EditorCanvas";
import { PropertiesPanel } from "@/components/PropertiesPanel";

export default function Home() {
  const [activeTab, setActiveTab] = useState<
    "upload" | "elements" | "text" | "media" | "live" | "more" | "layers"
  >("upload");
  const viewMode = useEditorStore((state) => state.viewMode);

  if (viewMode === "empty") {
    return <EmptyState />;
  }

  return (
    <main className="flex flex-col h-screen w-screen bg-bg-app overflow-hidden">
      <TopNav />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="shrink-0 z-20 h-full">
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Asset Library */}
        <div className="shrink-0 hidden lg:block z-10 h-full border-r border-border">
          <AssetLibrary activeTab={activeTab} />
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-[#111114] relative flex items-center justify-center overflow-hidden">
          <EditorCanvas isEmpty={false} />
        </div>

        {/* Properties Panel */}
        <div className="shrink-0 hidden xl:block h-full">
          <PropertiesPanel />
        </div>
      </div>

      {/* Bottom Timeline */}
      <div className="h-60 shrink-0 z-40">
        <Timeline />
      </div>
    </main>
  );
}
