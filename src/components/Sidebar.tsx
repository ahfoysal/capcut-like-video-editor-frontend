import React from "react";
import {
  Upload,
  Type,
  Image as ImageIcon,
  Shapes,
  MonitorPlay,
  MoreHorizontal,
  LayoutTemplate,
  Layers, // Added Layers icon
} from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarTab =
  | "upload"
  | "elements"
  | "text"
  | "media"
  | "live"
  | "more"
  | "layers"; // Added 'layers' to the type

interface SidebarProps {
  activeTab?: SidebarTab;
  onTabChange?: (tab: SidebarTab) => void;
}

export function Sidebar({ activeTab = "upload", onTabChange }: SidebarProps) {
  const menuItems = [
    { id: "upload" as const, icon: Upload, label: "Uploads" },
    { id: "elements" as const, icon: Shapes, label: "Elements" },
    { id: "text" as const, icon: Type, label: "Text" },
    { id: "media" as const, icon: ImageIcon, label: "Media" },
    { id: "live" as const, icon: MonitorPlay, label: "Live" },
    { id: "layers" as const, icon: Layers, label: "Layers" }, // Added Layers tab
    { id: "more" as const, icon: MoreHorizontal, label: "More" },
  ];

  return (
    <div className="w-18 h-full bg-bg-panel border-r border-border flex flex-col items-center py-4 gap-4 z-10 shadow-xl">
      {menuItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange?.(item.id)}
            className={cn(
              "flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all gap-1 group",
              isActive
                ? "bg-white text-black"
                : "text-text-muted hover:bg-white/5 hover:text-text-main",
            )}
          >
            <item.icon
              className={cn(
                "w-5 h-5 transition-transform group-active:scale-90",
                isActive && "stroke-[2.5px]",
              )}
            />
            <span className="text-[10px] font-bold tracking-tight">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
