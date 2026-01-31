'use client';

import {
    ArrowLeft,
    ZoomIn,
    ZoomOut,
    Undo2,
    Redo2,
    Moon,
    Sun,
    Pencil
} from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { cn } from '@/lib/utils';

export default function Header() {
    const {
        projectName,
        projectDate,
        zoom,
        setZoom,
        isDarkMode,
        toggleDarkMode
    } = useEditorStore();

    return (
        <header className={cn(
            "h-14 flex items-center justify-between px-4 border-b",
            isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
        )}>
            {/* Left section */}
            <div className="flex items-center gap-4">
                <button className={cn(
                    "flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity",
                    isDarkMode ? "text-white" : "text-gray-900"
                )}>
                    <ArrowLeft className="w-4 h-4" />
                    <span>Editor</span>
                </button>

                <div className="h-5 w-px bg-gray-300" />

                <div className="flex items-center gap-2">
                    <span className={cn(
                        "text-sm",
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                    )}>
                        {projectName}
                    </span>
                    <Pencil className="w-3 h-3 text-gray-400 cursor-pointer hover:text-gray-600" />
                </div>
            </div>

            {/* Center section - Zoom controls */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => setZoom(zoom - 10)}
                    className={cn(
                        "p-1.5 rounded-md hover:bg-gray-100 transition-colors",
                        isDarkMode && "hover:bg-gray-800"
                    )}
                >
                    <ZoomOut className={cn("w-4 h-4", isDarkMode ? "text-gray-300" : "text-gray-600")} />
                </button>

                <span className={cn(
                    "text-sm font-medium min-w-[40px] text-center",
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                )}>
                    {zoom}%
                </span>

                <button
                    onClick={() => setZoom(zoom + 10)}
                    className={cn(
                        "p-1.5 rounded-md hover:bg-gray-100 transition-colors",
                        isDarkMode && "hover:bg-gray-800"
                    )}
                >
                    <ZoomIn className={cn("w-4 h-4", isDarkMode ? "text-gray-300" : "text-gray-600")} />
                </button>

                <div className="h-5 w-px bg-gray-300 mx-2" />

                <button className={cn(
                    "p-1.5 rounded-md hover:bg-gray-100 transition-colors",
                    isDarkMode && "hover:bg-gray-800"
                )}>
                    <Undo2 className={cn("w-4 h-4", isDarkMode ? "text-gray-300" : "text-gray-600")} />
                </button>

                <button className={cn(
                    "p-1.5 rounded-md hover:bg-gray-100 transition-colors",
                    isDarkMode && "hover:bg-gray-800"
                )}>
                    <Redo2 className={cn("w-4 h-4", isDarkMode ? "text-gray-300" : "text-gray-600")} />
                </button>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-3">
                <button className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-lg transition-colors">
                    Update
                </button>

                <button
                    onClick={toggleDarkMode}
                    className={cn(
                        "p-2 rounded-md hover:bg-gray-100 transition-colors",
                        isDarkMode && "hover:bg-gray-800"
                    )}
                >
                    {isDarkMode ? (
                        <Sun className="w-5 h-5 text-yellow-400" />
                    ) : (
                        <Moon className="w-5 h-5 text-gray-600" />
                    )}
                </button>
            </div>
        </header>
    );
}
