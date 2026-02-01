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
  row: number;
  col: number;
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
    cols: 3,
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
    cells: [
      { id: "c1", row: 0, col: 0, rowSpan: 1, colSpan: 1, occupied: false }, // Header
      { id: "c2", row: 1, col: 0, rowSpan: 1, colSpan: 1, occupied: false }, // Main
      { id: "c3", row: 2, col: 0, rowSpan: 1, colSpan: 1, occupied: false }, // Footer
    ],
  },
];

// Helper function to get cell boundaries in pixels
export function getCellBoundaries(
  cell: GridCell,
  canvasWidth: number,
  canvasHeight: number,
  layout: GridLayout,
): { x: number; y: number; width: number; height: number } {
  const cellWidth = canvasWidth / layout.cols;
  const cellHeight = canvasHeight / layout.rows;

  return {
    x: cell.col * cellWidth,
    y: cell.row * cellHeight,
    width: cell.colSpan * cellWidth,
    height: cell.rowSpan * cellHeight,
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
  const cellWidth = canvasWidth / layout.cols;
  const cellHeight = canvasHeight / layout.rows;

  const col = Math.floor(x / cellWidth);
  const row = Math.floor(y / cellHeight);

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
