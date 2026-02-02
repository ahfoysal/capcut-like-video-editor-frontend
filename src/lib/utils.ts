import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { LayoutType, Size } from "@/types/editor";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function formatTimeShort(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function parseTime(timeString: string): number {
  const parts = timeString.split(":").map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}
export function getLayoutDimensions(
  pageOrLayout: { layout: LayoutType; customSize?: Size } | LayoutType = "16:9",
): Size {
  const layout =
    typeof pageOrLayout === "string" ? pageOrLayout : pageOrLayout.layout;
  const customSize =
    typeof pageOrLayout === "string" ? undefined : pageOrLayout.customSize;

  switch (layout) {
    case "1:1":
      return { width: 1080, height: 1080 };
    case "16:9":
      return { width: 1920, height: 1080 };
    case "9:16":
      return { width: 1080, height: 1920 };
    case "4:5":
      return { width: 1080, height: 1350 };
    case "2:3":
      return { width: 1080, height: 1620 };
    case "custom":
      return customSize || { width: 1920, height: 1080 };
    default:
      return { width: 1920, height: 1080 };
  }
}
