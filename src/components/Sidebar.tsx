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
    <div className="w-[72px] h-full bg-[#111114] border-r border-white/5 flex flex-col items-center py-6 gap-2 z-10 shadow-2xl relative">
      {menuItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange?.(item.id)}
            className={cn(
              "flex flex-col items-center justify-center w-[60px] h-[60px] rounded-xl transition-all duration-300 relative group",
              isActive
                ? "text-white"
                : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5",
            )}
          >
            {/* Active Indicator Bar */}
            {isActive && (
              <div className="absolute left-0 w-[3px] h-6 bg-[#5956E8] rounded-r-full shadow-[0_0_10px_rgba(89,86,232,0.8)]" />
            )}

            <div
              className={cn(
                "p-2 rounded-xl transition-all duration-300",
                isActive &&
                  "bg-[#5956E8]/10 shadow-[inner_0_0_10px_rgba(89,86,232,0.1)]",
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
                  ? "text-[#5956E8]"
                  : "text-zinc-600 group-hover:text-zinc-400",
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
