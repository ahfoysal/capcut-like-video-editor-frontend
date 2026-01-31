import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";

export function EmptyState() {
  const setViewMode = useEditorStore((state) => state.setViewMode);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-bg-app">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-40 h-40 flex items-center justify-center mx-auto mb-6">
          <img
            src="/images/e31b18ba16a89a9c9dd507dafa4685132997de1d.png"
            alt="Empty State"
            className="w-full h-full object-contain"
          />
        </div>

        <h1 className="text-2xl font-semibold text-text-main">
          No projects yet
        </h1>
        <p className="text-text-muted">
          Create your first digital signage project to get started.
        </p>

        <Button
          onClick={() => setViewMode("template")}
          className="bg-primary hover:bg-primary/90 text-white px-8 py-6 rounded-xl text-lg flex items-center gap-2 mx-auto"
        >
          <Plus size={24} />
          Create New Project
        </Button>
      </div>
    </div>
  );
}
