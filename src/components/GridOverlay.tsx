import React from "react";
import { GridLayout, GridCell } from "@/lib/gridLayouts";

interface GridOverlayProps {
  layout: GridLayout;
  canvasWidth: number;
  canvasHeight: number;
  hoveredCell?: GridCell | null;
  onCellHover?: (cell: GridCell | null) => void;
  onClick?: (cell: GridCell) => void;
  onLayoutChange?: (newLayout: GridLayout) => void;
}

export function GridOverlay({
  layout,
  canvasWidth,
  canvasHeight,
  hoveredCell,
  onCellHover,
  onClick,
  onLayoutChange,
}: GridOverlayProps) {
  const [resizing, setResizing] = React.useState<{
    type: "col" | "row";
    index: number;
    startPos: number; // in pixels
    startSizes: number[]; // percentages
  } | null>(null);

  // Helper to get current row heights / col widths or defaults
  const getColWidths = () => {
    if (layout.colWidths && layout.colWidths.length === layout.cols)
      return [...layout.colWidths];
    return Array(layout.cols).fill(100 / layout.cols);
  };

  const getRowHeights = () => {
    if (layout.rowHeights && layout.rowHeights.length === layout.rows)
      return [...layout.rowHeights];
    return Array(layout.rows).fill(100 / layout.rows);
  };

  const colWidths = getColWidths();
  const rowHeights = getRowHeights();

  // Calculate accumulated positions for rendering lines
  const colPositions = colWidths.reduce((acc, w, i) => {
    if (i === 0) return [w];
    return [...acc, acc[i - 1] + w];
  }, [] as number[]);

  const rowPositions = rowHeights.reduce((acc, h, i) => {
    if (i === 0) return [h];
    return [...acc, acc[i - 1] + h];
  }, [] as number[]);

  // Handlers for resizing
  const handleResizeStart = (
    e: React.MouseEvent,
    type: "col" | "row",
    index: number,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setResizing({
      type,
      index,
      startPos: type === "col" ? e.clientX : e.clientY,
      startSizes: type === "col" ? getColWidths() : getRowHeights(),
    });
  };

  React.useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();

      const currentPos = resizing.type === "col" ? e.clientX : e.clientY;
      const totalSizePx = resizing.type === "col" ? canvasWidth : canvasHeight;
      const deltaPx = currentPos - resizing.startPos;
      const deltaPct = (deltaPx / totalSizePx) * 100;

      const newSizes = [...resizing.startSizes];
      const idx = resizing.index;

      // We are resizing the divider between index and index+1
      // So index shrinks/grows, and index+1 grows/shrinks opposite
      const leftSize = newSizes[idx];
      const rightSize = newSizes[idx + 1];

      // Constraints (min 5%)
      const minSize = 5;

      let newLeft = leftSize + deltaPct;
      let newRight = rightSize - deltaPct;

      if (newLeft < minSize) {
        newRight -= minSize - newLeft;
        newLeft = minSize;
      }
      if (newRight < minSize) {
        newLeft -= minSize - newRight;
        newRight = minSize;
      }

      newSizes[idx] = newLeft;
      newSizes[idx + 1] = newRight;

      // Update layout
      if (onLayoutChange) {
        onLayoutChange({
          ...layout,
          [resizing.type === "col" ? "colWidths" : "rowHeights"]: newSizes,
        });
      }
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing, canvasWidth, canvasHeight, layout, onLayoutChange]);

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ width: canvasWidth, height: canvasHeight }}
    >
      {/* Grid lines & Resize Handles */}

      {/* Vertical Lines (Cols) */}
      {colPositions.slice(0, -1).map((posPct, i) => {
        const x = (posPct / 100) * canvasWidth;
        return (
          <React.Fragment key={`v-${i}`}>
            {/* Visual Line */}
            <div
              className="absolute top-0 bottom-0 border-l border-[#5956E8] border-dashed opacity-40 pointer-events-none"
              style={{ left: x, width: 1 }}
            />
            {/* Resize Handle */}
            <div
              className="absolute top-0 bottom-0 w-4 -ml-2 hover:bg-[#5956E8]/20 cursor-col-resize pointer-events-auto z-50 transition-colors"
              style={{ left: x }}
              onMouseDown={(e) => handleResizeStart(e, "col", i)}
            />
          </React.Fragment>
        );
      })}

      {/* Horizontal Lines (Rows) */}
      {rowPositions.slice(0, -1).map((posPct, i) => {
        const y = (posPct / 100) * canvasHeight;
        return (
          <React.Fragment key={`h-${i}`}>
            {/* Visual Line */}
            <div
              className="absolute left-0 right-0 border-t border-[#5956E8] border-dashed opacity-40 pointer-events-none"
              style={{ top: y, height: 1 }}
            />
            {/* Resize Handle */}
            <div
              className="absolute left-0 right-0 h-4 -mt-2 hover:bg-[#5956E8]/20 cursor-row-resize pointer-events-auto z-50 transition-colors"
              style={{ top: y }}
              onMouseDown={(e) => handleResizeStart(e, "row", i)}
            />
          </React.Fragment>
        );
      })}

      {/* Cell hover areas & Content */}
      {layout.cells.map((cell) => {
        // Calculate cell position based on accumulated percentages
        const startXPct = cell.col === 0 ? 0 : colPositions[cell.col - 1];
        const startYPct = cell.row === 0 ? 0 : rowPositions[cell.row - 1];

        // Width is sum of widths for spanned cols
        const endXPct = colPositions[cell.col + cell.colSpan - 1];
        const endYPct = rowPositions[cell.row + cell.rowSpan - 1];

        const widthPct = endXPct - startXPct;
        const heightPct = endYPct - startYPct;

        const x = (startXPct / 100) * canvasWidth;
        const y = (startYPct / 100) * canvasHeight;
        const width = (widthPct / 100) * canvasWidth;
        const height = (heightPct / 100) * canvasHeight;

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
