// Grid Layout Types and Utilities

export type GridLayoutType =
  | "single"
  | "2col"
  | "3col"
  | "2row"
  | "2x2"
  | "3x3"
  | "sidebar-left"
  | "sidebar-right"
  | "header-2col"
  | "header-footer";

export interface GridCell {
  id: string;
  row: number; // Starting row index
  col: number; // Starting col index
  rowSpan: number;
  colSpan: number;
  occupied: boolean;
  elementId?: string;
}

export interface GridLayout {
  id: string;
  name: string;
  type: GridLayoutType;
  rows: number;
  cols: number;
  // Arrays of percentages (summing to 100)
  // If undefined, assume equal distribution
  rowHeights?: number[];
  colWidths?: number[];
  cells: GridCell[];
  icon?: string;
}

// Preset grid layout configurations
export const PRESET_LAYOUTS: GridLayout[] = [
  {
    id: "single",
    name: "Single",
    type: "single",
    rows: 1,
    cols: 1,
    cells: [
      { id: "c1", row: 0, col: 0, rowSpan: 1, colSpan: 1, occupied: false },
    ],
  },
  {
    id: "2col",
    name: "Two Columns",
    type: "2col",
    rows: 1,
    cols: 2,
    colWidths: [50, 50],
    cells: [
      { id: "c1", row: 0, col: 0, rowSpan: 1, colSpan: 1, occupied: false },
      { id: "c2", row: 0, col: 1, rowSpan: 1, colSpan: 1, occupied: false },
    ],
  },
  {
    id: "3col",
    name: "Three Columns",
    type: "3col",
    rows: 1,
    cols: 3,
    colWidths: [33.33, 33.33, 33.34],
    cells: [
      { id: "c1", row: 0, col: 0, rowSpan: 1, colSpan: 1, occupied: false },
      { id: "c2", row: 0, col: 1, rowSpan: 1, colSpan: 1, occupied: false },
      { id: "c3", row: 0, col: 2, rowSpan: 1, colSpan: 1, occupied: false },
    ],
  },
  {
    id: "2row",
    name: "Two Rows",
    type: "2row",
    rows: 2,
    cols: 1,
    rowHeights: [50, 50],
    cells: [
      { id: "c1", row: 0, col: 0, rowSpan: 1, colSpan: 1, occupied: false },
      { id: "c2", row: 1, col: 0, rowSpan: 1, colSpan: 1, occupied: false },
    ],
  },
  {
    id: "2x2",
    name: "Grid 2x2",
    type: "2x2",
    rows: 2,
    cols: 2,
    rowHeights: [50, 50],
    colWidths: [50, 50],
    cells: [
      { id: "c1", row: 0, col: 0, rowSpan: 1, colSpan: 1, occupied: false },
      { id: "c2", row: 0, col: 1, rowSpan: 1, colSpan: 1, occupied: false },
      { id: "c3", row: 1, col: 0, rowSpan: 1, colSpan: 1, occupied: false },
      { id: "c4", row: 1, col: 1, rowSpan: 1, colSpan: 1, occupied: false },
    ],
  },
  {
    id: "3x3",
    name: "Grid 3x3",
    type: "3x3",
    rows: 3,
    cols: 3,
    rowHeights: [33.33, 33.33, 33.34],
    colWidths: [33.33, 33.33, 33.34],
    cells: Array.from({ length: 9 }, (_, i) => ({
      id: `c${i + 1}`,
      row: Math.floor(i / 3),
      col: i % 3,
      rowSpan: 1,
      colSpan: 1,
      occupied: false,
    })),
  },
  {
    id: "sidebar-left",
    name: "Sidebar Left",
    type: "sidebar-left",
    rows: 1,
    cols: 3, // Using 3 logical columns to allow spanning, but we can also do 2 uneven columns
    // Let's redefine as 2 columns with explicit widths for better resizing control
    // Actually, to keep consistency with the 'type', let's stick to the previous cell definition but add default widths
    colWidths: [33.33, 33.33, 33.34],
    cells: [
      { id: "c1", row: 0, col: 0, rowSpan: 1, colSpan: 1, occupied: false }, // 33% sidebar
      { id: "c2", row: 0, col: 1, rowSpan: 1, colSpan: 2, occupied: false }, // 67% main
    ],
  },
  {
    id: "sidebar-right",
    name: "Sidebar Right",
    type: "sidebar-right",
    rows: 1,
    cols: 3,
    colWidths: [33.33, 33.33, 33.34],
    cells: [
      { id: "c1", row: 0, col: 0, rowSpan: 1, colSpan: 2, occupied: false }, // 67% main
      { id: "c2", row: 0, col: 2, rowSpan: 1, colSpan: 1, occupied: false }, // 33% sidebar
    ],
  },
  {
    id: "header-2col",
    name: "Header + 2 Columns",
    type: "header-2col",
    rows: 2,
    cols: 2,
    rowHeights: [20, 80],
    colWidths: [50, 50],
    cells: [
      { id: "c1", row: 0, col: 0, rowSpan: 1, colSpan: 2, occupied: false }, // Header
      { id: "c2", row: 1, col: 0, rowSpan: 1, colSpan: 1, occupied: false }, // Left col
      { id: "c3", row: 1, col: 1, rowSpan: 1, colSpan: 1, occupied: false }, // Right col
    ],
  },
  {
    id: "header-footer",
    name: "Header + Footer",
    type: "header-footer",
    rows: 3,
    cols: 1,
    rowHeights: [15, 70, 15],
    cells: [
      { id: "c1", row: 0, col: 0, rowSpan: 1, colSpan: 1, occupied: false }, // Header
      { id: "c2", row: 1, col: 0, rowSpan: 1, colSpan: 1, occupied: false }, // Main
      { id: "c3", row: 2, col: 0, rowSpan: 1, colSpan: 1, occupied: false }, // Footer
    ],
  },
];

// Helper: Get accumulated percentage for a given index
function getAccumulated(
  values: number[] | undefined,
  count: number,
  index: number,
): number {
  if (!values || values.length !== count) {
    return (index / count) * 100;
  }
  return values.slice(0, index).reduce((sum, v) => sum + v, 0);
}

// Helper: Get size percentage for a span
function getSizePercentage(
  values: number[] | undefined,
  count: number,
  index: number,
  span: number,
): number {
  if (!values || values.length !== count) {
    return (span / count) * 100;
  }
  return values.slice(index, index + span).reduce((sum, v) => sum + v, 0);
}

// Helper function to get cell boundaries in pixels
export function getCellBoundaries(
  cell: GridCell,
  canvasWidth: number,
  canvasHeight: number,
  layout: GridLayout,
): { x: number; y: number; width: number; height: number } {
  // Use custom widths/heights if available, otherwise assume equal distribution
  const startXPct = getAccumulated(layout.colWidths, layout.cols, cell.col);
  const startYPct = getAccumulated(layout.rowHeights, layout.rows, cell.row);

  const widthPct = getSizePercentage(
    layout.colWidths,
    layout.cols,
    cell.col,
    cell.colSpan,
  );
  const heightPct = getSizePercentage(
    layout.rowHeights,
    layout.rows,
    cell.row,
    cell.rowSpan,
  );

  return {
    x: (startXPct / 100) * canvasWidth,
    y: (startYPct / 100) * canvasHeight,
    width: (widthPct / 100) * canvasWidth,
    height: (heightPct / 100) * canvasHeight,
  };
}

// Find which cell contains a given point
export function getCellAtPosition(
  x: number,
  y: number,
  canvasWidth: number,
  canvasHeight: number,
  layout: GridLayout,
): GridCell | null {
  // Normalize coordinates to percentages
  const xPct = (x / canvasWidth) * 100;
  const yPct = (y / canvasHeight) * 100;

  // Find column index
  let col = -1;
  let currentXPct = 0;
  for (let c = 0; c < layout.cols; c++) {
    const w = layout.colWidths ? layout.colWidths[c] : 100 / layout.cols;
    if (xPct >= currentXPct && xPct < currentXPct + w) {
      col = c;
      break;
    }
    currentXPct += w;
  }
  // Edge case for exactly 100% or slightly out of bounds due to floating point
  if (col === -1 && xPct >= 99.9) col = layout.cols - 1;

  // Find row index
  let row = -1;
  let currentYPct = 0;
  for (let r = 0; r < layout.rows; r++) {
    const h = layout.rowHeights ? layout.rowHeights[r] : 100 / layout.rows;
    if (yPct >= currentYPct && yPct < currentYPct + h) {
      row = r;
      break;
    }
    currentYPct += h;
  }
  if (row === -1 && yPct >= 99.9) row = layout.rows - 1;

  return (
    layout.cells.find(
      (cell) =>
        col >= cell.col &&
        col < cell.col + cell.colSpan &&
        row >= cell.row &&
        row < cell.row + cell.rowSpan,
    ) || null
  );
}

// Snap element to grid cell
export function snapToCell(
  x: number,
  y: number,
  canvasWidth: number,
  canvasHeight: number,
  layout: GridLayout,
): {
  x: number;
  y: number;
  width: number;
  height: number;
  cell: GridCell;
} | null {
  const cell = getCellAtPosition(x, y, canvasWidth, canvasHeight, layout);

  if (!cell) return null;

  const boundaries = getCellBoundaries(cell, canvasWidth, canvasHeight, layout);

  return {
    ...boundaries,
    cell,
  };
}

// Check if a cell is occupied
export function isCellOccupied(cellId: string, layout: GridLayout): boolean {
  const cell = layout.cells.find((c) => c.id === cellId);
  return cell?.occupied || false;
}

// Mark cell as occupied
export function occupyCell(
  cellId: string,
  elementId: string,
  layout: GridLayout,
): GridLayout {
  return {
    ...layout,
    cells: layout.cells.map((cell) =>
      cell.id === cellId ? { ...cell, occupied: true, elementId } : cell,
    ),
  };
}

// Free up a cell
export function freeCell(cellId: string, layout: GridLayout): GridLayout {
  return {
    ...layout,
    cells: layout.cells.map((cell) =>
      cell.id === cellId
        ? { ...cell, occupied: false, elementId: undefined }
        : cell,
    ),
  };
}
