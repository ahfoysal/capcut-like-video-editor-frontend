'use client';

import { useState, useRef } from 'react';
import { Search, Upload } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { cn } from '@/lib/utils';
import { generateId } from '@/lib/utils';
import { ImageElement, VideoElement, AudioElement, Resource } from '@/types/editor';

const filterTabs = [
    { id: 'all' as const, label: 'All' },
    { id: 'image' as const, label: 'Image' },
    { id: 'video' as const, label: 'Video' },
    { id: 'audio' as const, label: 'Audio' },
];

export default function ResourcePanel() {
    const {
        resources,
        activeResourceTab,
        setActiveResourceTab,
        isDarkMode,
        currentPageId,
        addElement,
        addResource
    } = useEditorStore();

    const [searchQuery, setSearchQuery] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const filteredResources = resources.filter(resource => {
        const matchesSearch = resource.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeResourceTab === 'all' || resource.type === activeResourceTab;
        return matchesSearch && matchesTab;
    });

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            Array.from(files).forEach(file => {
                const type = file.type.startsWith('image/')
                    ? 'image'
                    : file.type.startsWith('video/')
                        ? 'video'
                        : file.type.startsWith('audio/')
                            ? 'audio'
                            : null;

                if (type) {
                    const url = URL.createObjectURL(file);
                    addResource({
                        id: generateId(),
                        type,
                        name: file.name.length > 18 ? file.name.slice(0, 15) + '...' : file.name,
                        src: url,
                        thumbnail: type === 'image' || type === 'video' ? url : undefined,
                    });
                }
            });
        }
    };

    const handleResourceClick = (resource: Resource) => {
        const baseElement = {
            id: generateId(),
            name: resource.name,
            position: { x: 100, y: 100 },
            size: { width: 200, height: 150 },
            duration: resource.duration || 10,
            startTime: 0,
            freePosition: true,
        };

        if (resource.type === 'image') {
            const element: ImageElement = {
                ...baseElement,
                type: 'image',
                src: resource.src,
                fill: 'fill',
            };
            addElement(currentPageId, element);
        } else if (resource.type === 'video') {
            const element: VideoElement = {
                ...baseElement,
                type: 'video',
                src: resource.src,
                volume: 75,
                fill: 'fill',
                thumbnail: resource.thumbnail,
            };
            addElement(currentPageId, element);
        } else if (resource.type === 'audio') {
            const element: AudioElement = {
                ...baseElement,
                type: 'audio',
                src: resource.src,
                volume: 75,
                fadeIn: 1.5,
                fadeOut: 1.5,
                size: { width: 0, height: 0 },
            };
            addElement(currentPageId, element);
        }
    };

    const handleDragStart = (e: React.DragEvent, resource: Resource) => {
        e.dataTransfer.setData('application/json', JSON.stringify(resource));
    };

    return (
        <div className={cn(
            "w-64 flex flex-col border-r h-full",
            isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
        )}>
            {/* Header */}
            <div className={cn(
                "p-4 border-b",
                isDarkMode ? "border-gray-700" : "border-gray-200"
            )}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className={cn(
                        "text-sm font-semibold",
                        isDarkMode ? "text-white" : "text-gray-900"
                    )}>
                        My Resource
                    </h2>
                    <button
                        onClick={handleUploadClick}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                        <Upload className="w-3.5 h-3.5" />
                        Upload
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,video/*,audio/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>

                {/* Search */}
                <div className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border",
                    isDarkMode
                        ? "bg-gray-800 border-gray-700"
                        : "bg-gray-50 border-gray-200"
                )}>
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search Device"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={cn(
                            "flex-1 bg-transparent text-xs outline-none placeholder:text-gray-400",
                            isDarkMode ? "text-white" : "text-gray-900"
                        )}
                    />
                </div>
            </div>

            {/* Filter tabs */}
            <div className={cn(
                "flex items-center gap-1 p-3 border-b",
                isDarkMode ? "border-gray-700" : "border-gray-100"
            )}>
                {filterTabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveResourceTab(tab.id)}
                        className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                            activeResourceTab === tab.id
                                ? "bg-cyan-50 text-cyan-600"
                                : isDarkMode
                                    ? "text-gray-400 hover:text-gray-200"
                                    : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Resource grid */}
            <div className="flex-1 overflow-y-auto p-3">
                <div className="grid grid-cols-2 gap-3">
                    {filteredResources.map((resource) => (
                        <div
                            key={resource.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, resource)}
                            onClick={() => handleResourceClick(resource)}
                            className={cn(
                                "group relative cursor-pointer rounded-lg overflow-hidden border transition-all hover:border-cyan-400 hover:shadow-md",
                                isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
                            )}
                        >
                            {resource.type === 'audio' ? (
                                // Audio waveform visualization
                                <div className={cn(
                                    "aspect-square flex items-center justify-center",
                                    isDarkMode ? "bg-gray-800" : "bg-gray-50"
                                )}>
                                    <AudioWaveform />
                                </div>
                            ) : (
                                // Image/Video thumbnail
                                <div className="aspect-square overflow-hidden">
                                    <img
                                        src={resource.thumbnail || resource.src}
                                        alt={resource.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect fill="%23f3f4f6" width="100" height="100"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="12">Image</text></svg>';
                                        }}
                                    />
                                </div>
                            )}

                            <div className={cn(
                                "px-2 py-1.5",
                                isDarkMode ? "bg-gray-800" : "bg-white"
                            )}>
                                <p className={cn(
                                    "text-[10px] truncate",
                                    isDarkMode ? "text-gray-300" : "text-gray-600"
                                )}>
                                    {resource.name}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Audio waveform visualization component
function AudioWaveform() {
    // Fixed heights for consistent waveform look matching mockup
    const heights = [16, 28, 20, 32, 24, 36, 20, 28, 16];

    return (
        <div className="flex items-center justify-center gap-0.5 h-full">
            {heights.map((height, i) => (
                <div
                    key={i}
                    className="w-1 rounded-full bg-cyan-400"
                    style={{
                        height: `${height}px`,
                        opacity: 0.7 + (i % 2) * 0.3
                    }}
                />
            ))}
        </div>
    );
}
