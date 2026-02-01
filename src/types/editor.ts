export type LayoutType = "1:1" | "16:9" | "9:16" | "4:5" | "2:3";

export type ElementType =
  | "image"
  | "video"
  | "audio"
  | "text"
  | "qrcode"
  | "shape";

export type AnimationType = "enter" | "emphasis" | "exit";

export type AnimationEffect =
  | "fadeIn"
  | "enterLeft"
  | "enterRight"
  | "enterUp"
  | "enterDown"
  | "rotateIn"
  | "flipX"
  | "flipY"
  | "flip"
  | "zoomIn"
  | "rollIn"
  | "sliceIn";

export interface Animation {
  type: AnimationType;
  effect: AnimationEffect;
  duration: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface BaseElement {
  id: string;
  type: ElementType;
  name: string;
  position: Position;
  size: Size;
  duration: number;
  startTime: number;
  freePosition: boolean;
  animation?: Animation;
  layer?: number;
  opacity?: number;
  gridCell?: { cellId: string; col: number; row: number } | null;
  objectPosition?: { x: number; y: number };
  crop?: { x: number; y: number; width: number; height: number };
  trim?: { start: number; end: number };
}

export interface ImageElement extends BaseElement {
  type: "image";
  src: string;
  fill: "fill" | "fit" | "stretch";
}

export interface VideoElement extends BaseElement {
  type: "video";
  src: string;
  volume: number;
  fill: "fill" | "fit" | "stretch";
  thumbnail?: string;
  naturalDuration?: number;
}

export interface AudioElement extends BaseElement {
  type: "audio";
  src: string;
  volume: number;
  fadeIn: number;
  fadeOut: number;
  naturalDuration?: number;
}

export interface TextElement extends BaseElement {
  type: "text";
  content: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  backgroundColor?: string;
  borderRadius?: string;
  strokeColor?: string;
  strokeWidth?: number;
  fontFamily?: string;
  textAlign?: "left" | "center" | "right";
  marquee?: boolean;
  marqueeSpeed?: number;
  marqueeDirection?: "left" | "right";
}

export interface QRCodeElement extends BaseElement {
  type: "qrcode";
  data: string;
  title?: string;
}

export interface ShapeElement extends BaseElement {
  type: "shape";
  shapeType: string;
  color: string;
}

export type Element =
  | ImageElement
  | VideoElement
  | AudioElement
  | TextElement
  | QRCodeElement
  | ShapeElement;

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
}

export interface Page {
  id: string;
  name: string;
  duration: number;
  backgroundColor: string;
  layout: LayoutType;
  elements: Element[];
  animation?: {
    fadeIn?: { duration: number };
    fadeOut?: { duration: number };
  };
  gridLayout?: GridLayout | null;
  gridMode?: boolean;
}

export interface Resource {
  id: string;
  type: "image" | "video" | "audio";
  name: string;
  src: string;
  thumbnail?: string;
  duration?: number;
}

export interface EditorState {
  projectName: string;
  projectDate: string;
  pages: Page[];
  currentPageId: string;
  selectedElementId: string | null;
  resources: Resource[];
  zoom: number;
  timelinePosition: number;
  timelineZoom: number;
  isPlaying: boolean;
  isDarkMode: boolean;
  activeLeftTab: "upload" | "elements" | "live";
  activeResourceTab: "all" | "image" | "video" | "audio";
  projectId: string | null;
  saveStatus: "idle" | "saving" | "saved" | "error" | "loading";
  history: Page[][];
  future: Page[][];
}

export interface EditorActions {
  // Project actions
  resetProject: () => void;
  setProjectName: (name: string) => void;
  setZoom: (zoom: number) => void;
  setTimelineZoom: (zoom: number) => void;
  toggleDarkMode: () => void;
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  // Page actions
  addPage: () => void;
  duplicatePage: (pageId: string) => void;
  deletePage: (pageId: string) => void;
  setCurrentPage: (pageId: string) => void;
  updatePage: (pageId: string, updates: Partial<Page>) => void;

  // Element actions
  addElement: (pageId: string, element: Element) => void;
  updateElement: (
    pageId: string,
    elementId: string,
    updates: Partial<Element>,
  ) => void;
  deleteElement: (pageId: string, elementId: string) => void;
  setSelectedElement: (elementId: string | null) => void;
  duplicateElement: (pageId: string, elementId: string) => void;
  splitElement: (pageId: string, elementId: string, time: number) => void;
  moveElementToPage: (
    sourcePageId: string,
    targetPageId: string,
    elementId: string,
  ) => void;

  // Resource actions
  addResource: (resource: Resource) => void;
  deleteResource: (resourceId: string) => void;

  // Playback actions
  setTimelinePosition: (position: number | ((prev: number) => number)) => void;
  togglePlay: () => void;

  // Tab actions
  setActiveLeftTab: (tab: "upload" | "elements" | "live") => void;
  setActiveResourceTab: (tab: "all" | "image" | "video" | "audio") => void;

  // Grid layout actions
  setGridMode: (pageId: string, enabled: boolean) => void;
  setPageGridLayout: (pageId: string, layout: GridLayout | null) => void;
  updateGridCell: (
    pageId: string,
    cellId: string,
    updates: Partial<GridCell>,
  ) => void;

  // API Integration
  fetchProject: (projectId: string) => Promise<void>;
  fetchResources: () => Promise<void>;
  setSaveStatus: (status: EditorState["saveStatus"]) => void;
  saveProject: () => Promise<void>;
  uploadAsset: (file: File) => Promise<any>;
}

export type EditorStore = EditorState & EditorActions;
