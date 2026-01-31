import { create } from "zustand";
import { EditorStore, Page, Element } from "@/types/editor";
import { generateId } from "@/lib/utils";

export type ViewMode = "empty" | "template" | "editor";

interface EditorState extends EditorStore {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  clipboard: Element | null;
  copyElement: (elementId: string) => void;
  pasteElement: () => void;
}

// Sample resources and pages are now empty by default as requested.

const initialPageId = "page-initial"; // Use a static ID for hydration stability
const initialPages: Page[] = [
  {
    id: initialPageId,
    name: "Page 1",
    duration: 180,
    backgroundColor: "#FCFAFF",
    layout: "1:1",
    elements: [],
  },
];

export const useEditorStore = create<EditorState>((set, get) => ({
  // Initial state
  viewMode: "editor", // Changed from empty to editor
  setViewMode: (mode) => set({ viewMode: mode }),
  projectName: "Untitled Project",
  projectDate: "2026-01-31", // Static default for hydration
  pages: initialPages,
  currentPageId: initialPageId,
  selectedElementId: null,
  resources: [],
  zoom: 60,
  timelinePosition: 0,
  timelineZoom: 50, // Added timelineZoom with default value
  isPlaying: false,
  isDarkMode: false,
  activeLeftTab: "upload",
  activeResourceTab: "all",
  projectId: null,
  saveStatus: "idle",
  history: [],
  future: [],
  clipboard: null,

  // Project actions
  pushHistory: () => {
    const { pages, history } = get();
    // Deep copy pages to history
    const pagesCopy = JSON.parse(JSON.stringify(pages));
    set({
      history: [...history.slice(-49), pagesCopy], // Limit history to 50 steps
      future: [],
    });
  },

  undo: () => {
    const { history, pages, future } = get();
    if (history.length === 0) return;

    const previousPages = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    const pagesCopy = JSON.parse(JSON.stringify(pages));

    set({
      pages: previousPages,
      history: newHistory,
      future: [pagesCopy, ...future.slice(0, 49)],
      selectedElementId: null,
    });
  },

  redo: () => {
    const { future, pages, history } = get();
    if (future.length === 0) return;

    const nextPages = future[0];
    const newFuture = future.slice(1);
    const pagesCopy = JSON.parse(JSON.stringify(pages));

    set({
      pages: nextPages,
      future: newFuture,
      history: [...history, pagesCopy],
      selectedElementId: null,
    });
  },

  resetProject: () => {
    const newPageId = generateId();
    set({
      projectName: "Untitled Project",
      pages: [
        {
          id: newPageId,
          name: "Page 1",
          duration: 180,
          backgroundColor: "#FCFAFF",
          layout: "1:1",
          elements: [],
        },
      ],
      currentPageId: newPageId,
      selectedElementId: null,
      timelinePosition: 0,
      isPlaying: false,
      projectId: null,
      saveStatus: "idle",
      history: [],
      future: [],
    });
  },

  setProjectName: (name) => {
    set({ projectName: name });
    get().saveProject(); // Auto-save on name change
  },

  setZoom: (zoom) => {
    console.log("Setting zoom to:", zoom);
    set({ zoom: Math.max(10, Math.min(200, zoom)) });
  },

  setTimelineZoom: (zoom) =>
    set({ timelineZoom: Math.max(10, Math.min(200, zoom)) }),

  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

  // Page actions
  addPage: () => {
    get().pushHistory();
    const pages = get().pages;
    const newPage: Page = {
      id: generateId(),
      name: `Page ${pages.length + 1}`,
      duration: 180,
      backgroundColor: "#FCFAFF",
      layout: "1:1",
      elements: [],
    };
    set({
      pages: [...pages, newPage],
      currentPageId: newPage.id,
    });
  },

  fetchResources: async () => {
    try {
      const response = await fetch("http://localhost:3001/assets");
      const data = await response.json();
      set({ resources: data });
    } catch (error) {
      console.error("Error fetching resources:", error);
    }
  },

  duplicatePage: (pageId) => {
    get().pushHistory();
    const pages = get().pages;
    const pageToDuplicate = pages.find((p) => p.id === pageId);
    if (pageToDuplicate) {
      const newPage: Page = {
        ...pageToDuplicate,
        id: generateId(),
        name: `${pageToDuplicate.name} (Copy)`,
        elements: pageToDuplicate.elements.map((el) => ({
          ...el,
          id: generateId(),
        })),
      };
      const index = pages.findIndex((p) => p.id === pageId);
      const newPages = [...pages];
      newPages.splice(index + 1, 0, newPage);
      set({ pages: newPages, currentPageId: newPage.id });
    }
  },

  deletePage: (pageId) => {
    const pages = get().pages;
    if (pages.length > 1) {
      get().pushHistory();
      const newPages = pages.filter((p) => p.id !== pageId);
      const currentPageId = get().currentPageId;
      set({
        pages: newPages,
        currentPageId:
          currentPageId === pageId ? newPages[0].id : currentPageId,
      });
    }
  },

  setCurrentPage: (pageId) =>
    set({ currentPageId: pageId, selectedElementId: null }),

  updatePage: (pageId, updates) => {
    get().pushHistory();
    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === pageId ? { ...p, ...updates } : p,
      ),
    }));
  },

  // Element actions
  addElement: (pageId, element) => {
    get().pushHistory();
    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === pageId ? { ...p, elements: [...p.elements, element] } : p,
      ),
      selectedElementId: element.id,
    }));
  },

  updateElement: (pageId, elementId, updates) => {
    // Only push to history if it's not a frequent update like drag (maybe)
    // Actually, for simplicity, let's just push.
    // Optimization: throttling pushHistory for updates
    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === pageId
          ? {
              ...p,
              elements: p.elements.map((el) =>
                el.id === elementId ? ({ ...el, ...updates } as Element) : el,
              ),
            }
          : p,
      ),
    }));
  },

  deleteElement: (pageId, elementId) => {
    get().pushHistory();
    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === pageId
          ? { ...p, elements: p.elements.filter((el) => el.id !== elementId) }
          : p,
      ),
      selectedElementId:
        state.selectedElementId === elementId ? null : state.selectedElementId,
    }));
  },

  setSelectedElement: (elementId) => set({ selectedElementId: elementId }),

  duplicateElement: (pageId, elementId) => {
    const page = get().pages.find((p) => p.id === pageId);
    const element = page?.elements.find((el) => el.id === elementId);
    if (element) {
      const newElement: Element = {
        ...element,
        id: generateId(),
        name: `${element.name} (Copy)`,
        position: {
          x: element.position.x + 20,
          y: element.position.y + 20,
        },
      };
      get().addElement(pageId, newElement);
    }
  },

  splitElement: (pageId, elementId, time) => {
    const page = get().pages.find((p) => p.id === pageId);
    const element = page?.elements.find((el) => el.id === elementId);

    if (
      element &&
      time > element.startTime &&
      time < element.startTime + element.duration
    ) {
      const originalDuration = element.duration;
      const firstPartDuration = time - element.startTime;
      const secondPartDuration = originalDuration - firstPartDuration;

      // Update first part
      get().updateElement(pageId, elementId, { duration: firstPartDuration });

      // Create second part
      const newElement: Element = {
        ...element,
        id: generateId(),
        name: `${element.name} (Split)`,
        startTime: time,
        duration: secondPartDuration,
      };
      get().addElement(pageId, newElement);
    }
  },

  // Resource actions
  addResource: (resource) => {
    set((state) => ({ resources: [...state.resources, resource] }));
  },

  deleteResource: (resourceId) => {
    set((state) => ({
      resources: state.resources.filter((r) => r.id !== resourceId),
    }));
  },

  // Clipboard actions
  copyElement: (elementId) => {
    const { pages, currentPageId } = get();
    const page = pages.find((p) => p.id === currentPageId);
    const element = page?.elements.find((el) => el.id === elementId);
    if (element) {
      set({ clipboard: JSON.parse(JSON.stringify(element)) });
    }
  },

  pasteElement: () => {
    const { clipboard, currentPageId, addElement } = get();
    if (clipboard && currentPageId) {
      const pastedElement = {
        ...JSON.parse(JSON.stringify(clipboard)),
        id: generateId(),
        position: {
          x: clipboard.position.x + 20,
          y: clipboard.position.y + 20,
        },
        startTime: get().timelinePosition,
      };
      addElement(currentPageId, pastedElement);
    }
  },

  // Playback actions
  setTimelinePosition: (positionOrUpdater) =>
    set((state) => ({
      timelinePosition:
        typeof positionOrUpdater === "function"
          ? positionOrUpdater(state.timelinePosition)
          : positionOrUpdater,
    })),

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  // Tab actions
  setActiveLeftTab: (tab) => set({ activeLeftTab: tab }),
  setActiveResourceTab: (tab) => set({ activeResourceTab: tab }),

  // API Integration
  fetchProject: async (projectId: string) => {
    set({ saveStatus: "loading" });
    try {
      const response = await fetch(
        `http://localhost:3001/projects/${projectId}`,
      );
      if (!response.ok) throw new Error("Failed to fetch project");
      const project = await response.json();

      // Transform backend elements (properties JSON) to frontend elements if needed
      // Currently, we'll assume they match or we handle them gracefully
      set({
        projectId: project.id,
        projectName: project.name,
        pages: project.pages || [],
        currentPageId: project.pages?.[0]?.id || null,
        viewMode: "editor",
        saveStatus: "saved",
      });
    } catch (error) {
      console.error("Error fetching project:", error);
      set({ saveStatus: "error" });
    }
  },

  saveProject: async () => {
    const { projectId, projectName, pages, saveStatus } = get();
    if (saveStatus === "saving") return;

    set({ saveStatus: "saving" });
    try {
      const url = projectId
        ? `http://localhost:3001/projects/${projectId}`
        : `http://localhost:3001/projects`;

      const method = projectId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          pages: pages.map((p) => ({
            id: p.id,
            name: p.name,
            duration: p.duration,
            backgroundColor: p.backgroundColor,
            layout: p.layout,
            elements: p.elements.map((el) => ({
              id: el.id,
              type: el.type,
              startTime: Math.round(el.startTime * 1000),
              duration: Math.round(el.duration * 1000),
              properties: el, // Store all fields in properties JSON
            })),
          })),
        }),
      });

      if (!response.ok) throw new Error("Failed to save project");
      const savedProject = await response.json();

      set({
        projectId: savedProject.id,
        saveStatus: "saved",
      });
      console.log("Project saved successfully");
    } catch (error) {
      console.error("Error saving project:", error);
      set({ saveStatus: "error" });
    }
  },

  uploadAsset: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch(`http://localhost:3001/assets/upload`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to upload asset");
      const newAsset = await response.json();
      console.log("Asset uploaded successfully");

      // Add to store immediately
      const resource = {
        id: newAsset.id,
        type: newAsset.type,
        name: newAsset.name,
        src: newAsset.url,
      };
      get().addResource(resource);

      return newAsset;
    } catch (error) {
      console.error("Error uploading asset:", error);
      throw error;
    }
  },
}));
