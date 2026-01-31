'use client';

import { useRef, useState, useEffect } from 'react';
import {
    Play,
    Pause,
    Home,
    Plus,
    X,
    Image as ImageIcon,
    Video,
    Type,
    Volume2,
    Layers
} from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { cn, formatTimeShort } from '@/lib/utils';
import { Element } from '@/types/editor';

export default function Timeline() {
    const {
        pages,
        currentPageId,
        setCurrentPage,
        addPage,
        deletePage,
        selectedElementId,
        setSelectedElement,
        timelinePosition,
        setTimelinePosition,
        isPlaying,
        togglePlay,
        isDarkMode
    } = useEditorStore();

    const timelineRef = useRef<HTMLDivElement>(null);
    const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);

    const currentPage = pages.find(p => p.id === currentPageId);
    const totalDuration = currentPage?.duration || 180;
    const pixelsPerSecond = 10;
    const timelineWidth = totalDuration * pixelsPerSecond;

    // Generate time markers
    const timeMarkers = [];
    for (let i = 0; i <= totalDuration; i += 60) {
        timeMarkers.push(i);
    }

    // Handle playhead drag
    const handleTimelineClick = (e: React.MouseEvent) => {
        if (timelineRef.current) {
            const rect = timelineRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
            const newPosition = Math.max(0, Math.min(x / pixelsPerSecond, totalDuration));
            setTimelinePosition(newPosition);
        }
    };

    const handlePlayheadMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDraggingPlayhead(true);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDraggingPlayhead && timelineRef.current) {
                const rect = timelineRef.current.getBoundingClientRect();
                const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
                const newPosition = Math.max(0, Math.min(x / pixelsPerSecond, totalDuration));
                setTimelinePosition(newPosition);
            }
        };

        const handleMouseUp = () => {
            setIsDraggingPlayhead(false);
        };

        if (isDraggingPlayhead) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDraggingPlayhead, totalDuration, setTimelinePosition]);

    // Playback simulation
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying) {
            interval = setInterval(() => {
                setTimelinePosition(prev => {
                    if (prev >= totalDuration) {
                        togglePlay();
                        return 0;
                    }
                    return prev + 0.1;
                });
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isPlaying, totalDuration, setTimelinePosition, togglePlay]);

    // Group elements by type for track display
    const imageElements = currentPage?.elements.filter(el => el.type === 'image') || [];
    const videoElements = currentPage?.elements.filter(el => el.type === 'video') || [];
    const textElements = currentPage?.elements.filter(el => el.type === 'text') || [];
    const audioElements = currentPage?.elements.filter(el => el.type === 'audio') || [];

    const getTrackColor = (type: Element['type']) => {
        switch (type) {
            case 'image': return 'bg-blue-400';
            case 'video': return 'bg-green-400';
            case 'text': return 'bg-purple-400';
            case 'audio': return 'bg-gray-500';
            default: return 'bg-gray-400';
        }
    };

    return (
        <div className={cn(
            "flex flex-col border-t",
            isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
        )}>
            {/* Page tabs */}
            <div className={cn(
                "flex items-center gap-2 px-4 py-2 border-b overflow-x-auto",
                isDarkMode ? "border-gray-700" : "border-gray-200"
            )}>
                <button className={cn(
                    "p-2 rounded-lg transition-colors",
                    isDarkMode ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"
                )}>
                    <Home className="w-4 h-4" />
                </button>

                {pages.map((page, index) => (
                    <button
                        key={page.id}
                        onClick={() => setCurrentPage(page.id)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                            currentPageId === page.id
                                ? "bg-cyan-500 text-white"
                                : isDarkMode
                                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                    >
                        Page {index + 1}
                    </button>
                ))}

                {/* Layout tabs */}
                {currentPage?.elements.filter(el => el.type !== 'audio').map((el, idx) => (
                    <div
                        key={el.id}
                        onClick={() => setSelectedElement(el.id)}
                        className={cn(
                            "flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer",
                            selectedElementId === el.id
                                ? "bg-cyan-100 text-cyan-600"
                                : isDarkMode
                                    ? "bg-gray-800 text-gray-400 hover:bg-gray-700"
                                    : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                        )}
                    >
                        <Layers className="w-3 h-3" />
                        <span>Layout</span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                // Remove element
                            }}
                            className="ml-1 p-0.5 hover:bg-gray-200 rounded"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}

                <button
                    onClick={addPage}
                    className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        isDarkMode ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"
                    )}
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            {/* Playback controls and time display */}
            <div className="flex items-center justify-center gap-4 py-3">
                <button
                    onClick={togglePlay}
                    className="p-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full transition-colors"
                >
                    {isPlaying ? (
                        <Pause className="w-5 h-5" />
                    ) : (
                        <Play className="w-5 h-5 ml-0.5" />
                    )}
                </button>
                <div className={cn(
                    "text-sm font-medium",
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                )}>
                    <span>{formatTimeShort(timelinePosition)}</span>
                    <span className="mx-2 text-gray-400">|</span>
                    <span className="text-gray-400">{formatTimeShort(totalDuration)}</span>
                </div>
            </div>

            {/* Timeline area */}
            <div
                ref={timelineRef}
                className="relative flex-1 overflow-x-auto"
                onClick={handleTimelineClick}
            >
                {/* Time ruler */}
                <div className={cn(
                    "h-6 border-b flex items-end",
                    isDarkMode ? "border-gray-700" : "border-gray-200"
                )} style={{ width: timelineWidth }}>
                    {timeMarkers.map((time) => (
                        <div
                            key={time}
                            className="absolute flex flex-col items-center"
                            style={{ left: time * pixelsPerSecond }}
                        >
                            <span className={cn(
                                "text-[10px]",
                                isDarkMode ? "text-gray-500" : "text-gray-400"
                            )}>
                                {formatTimeShort(time)}
                            </span>
                            <div className={cn(
                                "w-px h-2",
                                isDarkMode ? "bg-gray-600" : "bg-gray-300"
                            )} />
                        </div>
                    ))}
                    {/* Minor ticks */}
                    {Array.from({ length: Math.ceil(totalDuration / 10) }).map((_, i) => (
                        <div
                            key={`tick-${i}`}
                            className={cn(
                                "absolute bottom-0 w-px h-1.5",
                                isDarkMode ? "bg-gray-700" : "bg-gray-200"
                            )}
                            style={{ left: i * 10 * pixelsPerSecond }}
                        />
                    ))}
                </div>

                {/* Tracks container */}
                <div className="relative" style={{ width: timelineWidth, minHeight: 120 }}>
                    {/* Empty row track */}
                    <div className={cn(
                        "h-8 flex items-center gap-2 px-2 border-b",
                        isDarkMode ? "border-gray-700" : "border-gray-100"
                    )}>
                        <div className={cn(
                            "w-6 h-6 flex items-center justify-center rounded",
                            isDarkMode ? "bg-gray-800" : "bg-gray-100"
                        )}>
                            <Layers className="w-3 h-3 text-gray-400" />
                        </div>
                    </div>

                    {/* Image track */}
                    <div className={cn(
                        "h-8 flex items-center gap-2 px-2 border-b relative",
                        isDarkMode ? "border-gray-700" : "border-gray-100"
                    )}>
                        <div className={cn(
                            "w-6 h-6 flex items-center justify-center rounded flex-shrink-0",
                            isDarkMode ? "bg-gray-800" : "bg-gray-100"
                        )}>
                            <ImageIcon className="w-3 h-3 text-gray-400" />
                        </div>
                        {imageElements.map((el) => (
                            <div
                                key={el.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedElement(el.id);
                                }}
                                className={cn(
                                    "absolute h-6 rounded flex items-center px-2 cursor-pointer transition-all",
                                    getTrackColor('image'),
                                    selectedElementId === el.id && "ring-2 ring-cyan-400"
                                )}
                                style={{
                                    left: 28 + el.startTime * pixelsPerSecond,
                                    width: el.duration * pixelsPerSecond,
                                }}
                            >
                                <span className="text-xs text-white truncate">{el.name}</span>
                            </div>
                        ))}
                    </div>

                    {/* Video track */}
                    <div className={cn(
                        "h-8 flex items-center gap-2 px-2 border-b relative",
                        isDarkMode ? "border-gray-700" : "border-gray-100"
                    )}>
                        <div className={cn(
                            "w-6 h-6 flex items-center justify-center rounded flex-shrink-0",
                            isDarkMode ? "bg-gray-800" : "bg-gray-100"
                        )}>
                            <Video className="w-3 h-3 text-gray-400" />
                        </div>
                        {videoElements.map((el) => (
                            <div
                                key={el.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedElement(el.id);
                                }}
                                className={cn(
                                    "absolute h-6 rounded flex items-center px-2 cursor-pointer transition-all",
                                    getTrackColor('video'),
                                    selectedElementId === el.id && "ring-2 ring-cyan-400"
                                )}
                                style={{
                                    left: 28 + el.startTime * pixelsPerSecond,
                                    width: el.duration * pixelsPerSecond,
                                }}
                            >
                                <span className="text-xs text-white truncate">{el.name}</span>
                            </div>
                        ))}
                    </div>

                    {/* Text track */}
                    <div className={cn(
                        "h-8 flex items-center gap-2 px-2 border-b relative",
                        isDarkMode ? "border-gray-700" : "border-gray-100"
                    )}>
                        <div className={cn(
                            "w-6 h-6 flex items-center justify-center rounded flex-shrink-0",
                            isDarkMode ? "bg-gray-800" : "bg-gray-100"
                        )}>
                            <Type className="w-3 h-3 text-gray-400" />
                        </div>
                        {textElements.map((el) => (
                            <div
                                key={el.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedElement(el.id);
                                }}
                                className={cn(
                                    "absolute h-6 rounded flex items-center px-2 cursor-pointer transition-all",
                                    getTrackColor('text'),
                                    selectedElementId === el.id && "ring-2 ring-cyan-400"
                                )}
                                style={{
                                    left: 28 + el.startTime * pixelsPerSecond,
                                    width: el.duration * pixelsPerSecond,
                                }}
                            >
                                <span className="text-xs text-white truncate">{el.name}</span>
                            </div>
                        ))}
                    </div>

                    {/* Audio track */}
                    <div className={cn(
                        "h-8 flex items-center gap-2 px-2 relative",
                        isDarkMode ? "border-gray-700" : "border-gray-100"
                    )}>
                        <div className={cn(
                            "w-6 h-6 flex items-center justify-center rounded flex-shrink-0",
                            isDarkMode ? "bg-gray-800" : "bg-gray-100"
                        )}>
                            <Volume2 className="w-3 h-3 text-gray-400" />
                        </div>
                        {audioElements.map((el) => (
                            <div
                                key={el.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedElement(el.id);
                                }}
                                className={cn(
                                    "absolute h-6 rounded flex items-center px-2 cursor-pointer transition-all",
                                    getTrackColor('audio'),
                                    selectedElementId === el.id && "ring-2 ring-cyan-400"
                                )}
                                style={{
                                    left: 28 + el.startTime * pixelsPerSecond,
                                    width: el.duration * pixelsPerSecond,
                                }}
                            >
                                <span className="text-xs text-white truncate">{el.name}</span>
                            </div>
                        ))}
                    </div>

                    {/* Playhead */}
                    <div
                        className="absolute top-0 bottom-0 w-0.5 bg-cyan-500 cursor-ew-resize z-10"
                        style={{ left: timelinePosition * pixelsPerSecond }}
                        onMouseDown={handlePlayheadMouseDown}
                    >
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-cyan-500 rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}
