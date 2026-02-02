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
    <div className="w-[72px] h-full bg-bg-panel border-r border-border flex flex-col items-center py-6 gap-2 z-10 relative">
      {menuItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange?.(item.id)}
            className={cn(
              "flex flex-col items-center justify-center w-[60px] h-[60px] rounded-xl transition-all duration-300 relative group",
              isActive
                ? "text-text-main"
                : "text-text-muted hover:text-text-main hover:bg-bg-hover",
            )}
          >
            {/* Active Indicator Bar */}
            {isActive && (
              <div className="absolute left-0 w-[3px] h-6 bg-primary rounded-r-full shadow-[0_0_10px_rgba(15,166,255,0.4)]" />
            )}

            <div
              className={cn(
                "p-2 rounded-xl transition-all duration-300",
                isActive &&
                  "bg-primary/10 shadow-[inner_0_0_10px_rgba(15,166,255,0.05)]",
              )}
            >
              <item.icon
                className={cn(
                  "w-[22px] h-[22px] transition-transform group-hover:scale-110 group-active:scale-95",
                  isActive ? "stroke-[2.2px]" : "stroke-[1.8px]",
                )}
              />
            </div>
            <span
              className={cn(
                "text-[9px] font-black uppercase tracking-widest mt-1 transition-colors duration-300",
                isActive
                  ? "text-primary"
                  : "text-text-muted group-hover:text-text-main",
              )}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
