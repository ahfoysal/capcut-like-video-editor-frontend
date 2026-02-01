import React, { useEffect } from "react";
import { useEditorStore } from "@/store/editorStore";
import { Plus, Trash2, Calendar, Monitor, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProjectList() {
  const {
    allProjects,
    fetchAllProjects,
    fetchProject,
    setViewMode,
    deleteProjectById,
    resetProject,
    setProjectName,
  } = useEditorStore();

  useEffect(() => {
    fetchAllProjects();
  }, [fetchAllProjects]);

  const handleNewProject = async () => {
    const name = window.prompt("Enter project name:", "Untitled Project");
    if (name !== null) {
      resetProject();
      setProjectName(name || "Untitled Project");
      await useEditorStore.getState().saveProject();
      setViewMode("editor");
    }
  };

  const handleOpenProject = (id: string) => {
    fetchProject(id);
  };

  return (
    <div className="flex-1 h-full bg-[#0a0a0c] overflow-y-auto p-12 custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">
              My Projects
            </h1>
            <p className="text-text-muted mt-2 text-lg">
              Manage and edit your video creations
            </p>
          </div>
          <button
            onClick={handleNewProject}
            className="flex items-center gap-3 bg-accent text-black hover:bg-cyan-300 px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)] active:scale-95"
          >
            <Plus size={24} />
            Create Project
          </button>
        </div>

        {/* Content */}
        {allProjects.length === 0 ? (
          <div className="bg-secondary/5 border border-white/5 rounded-3xl p-20 text-center space-y-6">
            <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10 shadow-inner">
              <Monitor size={48} className="text-white/20" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                No projects found
              </h2>
              <p className="text-text-muted mt-2">
                Start your journey by creating a new project
              </p>
            </div>
            <button
              onClick={handleNewProject}
              className="text-accent font-bold hover:underline"
            >
              Get started now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allProjects.map((project: any) => (
              <div
                key={project.id}
                className="group bg-secondary/10 border border-white/5 rounded-2xl overflow-hidden hover:border-accent/50 transition-all hover:shadow-[0_0_40px_rgba(34,211,238,0.1)] flex flex-col cursor-pointer"
                onClick={() => handleOpenProject(project.id)}
              >
                {/* Thumbnail Placeholder */}
                <div className="aspect-video bg-black/40 flex items-center justify-center relative border-b border-white/5">
                  <Monitor
                    size={48}
                    className="text-white/10 group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-white font-bold text-sm flex items-center gap-2">
                      Open Editor <ChevronRight size={16} />
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-xl font-bold text-text-main truncate group-hover:text-accent transition-colors">
                      {project.name}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this project?"))
                          deleteProjectById(project.id);
                      }}
                      className="p-2 hover:bg-red-500/20 rounded-lg text-text-muted hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mt-4 text-[13px] font-bold text-text-muted uppercase tracking-widest opacity-60">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </div>
                    <span>•</span>
                    <div>{project.pages?.length || 0} Pages</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
