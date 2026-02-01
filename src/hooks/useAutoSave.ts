import { useEffect, useRef } from "react";
import { useEditorStore } from "@/store/editorStore";

export function useAutoSave(debounceMs: number = 2000) {
  const { pages, projectName, saveProject, setSaveStatus, projectId, viewMode } =
    useEditorStore();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Only auto-save if we are in editor mode and have a project ID
    if (viewMode !== "editor" || !projectId) return;

    // Skip the very first render to avoid saving immediately on load
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Show "Saving" with spinner as soon as something changed
    setSaveStatus("saving");

    timeoutRef.current = setTimeout(() => {
      saveProject();
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [pages, projectName, saveProject, setSaveStatus, projectId, viewMode, debounceMs]);
}
