import React from "react";
import { GridLayout, GridCell } from "@/lib/gridLayouts";

interface GridOverlayProps {
  layout: GridLayout;
  canvasWidth: number;
  canvasHeight: number;
  hoveredCell?: GridCell | null;
  onCellHover?: (cell: GridCell | null) => void;
  onClick?: (cell: GridCell) => void;
}

export function GridOverlay({
  layout,
  canvasWidth,
  canvasHeight,
  hoveredCell,
  onCellHover,
  onClick,
}: GridOverlayProps) {
  const cellWidth = canvasWidth / layout.cols;
  const cellHeight = canvasHeight / layout.rows;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ width: canvasWidth, height: canvasHeight }}
    >
      {/* Grid lines */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: "none" }}
      >
        {/* Vertical lines */}
        {Array.from({ length: layout.cols + 1 }).map((_, i) => (
          <line
            key={`v-${i}`}
            x1={i * cellWidth}
            y1={0}
            x2={i * cellWidth}
            y2={canvasHeight}
            stroke="#5956E8"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.4"
          />
        ))}

        {/* Horizontal lines */}
        {Array.from({ length: layout.rows + 1 }).map((_, i) => (
          <line
            key={`h-${i}`}
            x1={0}
            y1={i * cellHeight}
            x2={canvasWidth}
            y2={i * cellHeight}
            stroke="#5956E8"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.4"
          />
        ))}
      </svg>

      {/* Cell hover areas */}
      {layout.cells.map((cell) => {
        const x = cell.col * cellWidth;
        const y = cell.row * cellHeight;
        const width = cell.colSpan * cellWidth;
        const height = cell.rowSpan * cellHeight;
        const isHovered = hoveredCell?.id === cell.id;

        return (
          <div
            key={cell.id}
            className={`
              absolute border-2 transition-all pointer-events-auto cursor-pointer
              ${isHovered ? "bg-[#5956E8]/10 border-[#5956E8]" : "border-transparent"}
              ${cell.occupied ? "bg-[#5956E8]/5" : ""}
            `}
            style={{
              left: x,
              top: y,
              width,
              height,
            }}
            onMouseEnter={() => onCellHover?.(cell)}
            onMouseLeave={() => onCellHover?.(null)}
            onClick={() => onClick?.(cell)}
            title={
              cell.occupied
                ? `Occupied by ${cell.elementId}`
                : `Cell ${cell.id}`
            }
          />
        );
      })}
    </div>
  );
}
