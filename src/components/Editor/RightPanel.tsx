'use client';

import { useState } from 'react';
import {
    Copy,
    AlignLeft,
    AlignRight,
    Trash2,
    Plus,
    ChevronDown,
    Volume2,
    Pencil,
    Move,
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    Maximize
} from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { cn, formatTime } from '@/lib/utils';
import {
    Element,
    ImageElement,
    VideoElement,
    AudioElement,
    TextElement,
    LayoutType,
    AnimationEffect
} from '@/types/editor';

const layouts: { id: LayoutType; label: string }[] = [
    { id: '1:1', label: '1:1 Horizontal' },
    { id: '1:1-v', label: '1:1 Vertical' },
    { id: '2:1-h', label: '2:1 Horizontal' },
    { id: '1:2-v', label: '1:2 Vertical' },
    { id: '2:1-v', label: '2:1 Vertical' },
    { id: '2:2', label: '2:2' },
];

const layoutGrids = [
    { cols: 1, rows: 1 },
    { cols: 2, rows: 1 },
    { cols: 3, rows: 1 },
    { cols: 1, rows: 2 },
    { cols: 2, rows: 2 },
    { cols: 1, rows: 3 },
    { cols: 3, rows: 2 },
    { cols: 2, rows: 3 },
];

const enterAnimations: { id: AnimationEffect; label: string }[] = [
    { id: 'fadeIn', label: 'Fade In' },
    { id: 'enterLeft', label: 'Enter Left' },
    { id: 'enterRight', label: 'Enter Right' },
    { id: 'enterUp', label: 'Enter Up' },
    { id: 'enterDown', label: 'Enter Down' },
    { id: 'rotateIn', label: 'Rotate In' },
    { id: 'flipX', label: 'Flip X' },
    { id: 'flipY', label: 'Flip Y' },
    { id: 'flip', label: 'Flip' },
    { id: 'zoomIn', label: 'Zoom In' },
    { id: 'rollIn', label: 'Roll In' },
    { id: 'sliceIn', label: 'Slice In' },
];

export default function RightPanel() {
    const {
        pages,
        currentPageId,
        selectedElementId,
        updatePage,
        updateElement,
        deleteElement,
        duplicateElement,
        isDarkMode
    } = useEditorStore();

    const [showLayoutDropdown, setShowLayoutDropdown] = useState(false);
    const [activeAnimationTab, setActiveAnimationTab] = useState<'enter' | 'emphasis' | 'exit'>('enter');
    const [showAnimation, setShowAnimation] = useState(false);

    const currentPage = pages.find(p => p.id === currentPageId);
    const selectedElement = currentPage?.elements.find(el => el.id === selectedElementId);

    // Render page properties when no element is selected
    if (!selectedElement) {
        return (
            <PageProperties
                page={currentPage!}
                updatePage={updatePage}
                showLayoutDropdown={showLayoutDropdown}
                setShowLayoutDropdown={setShowLayoutDropdown}
                showAnimation={showAnimation}
                setShowAnimation={setShowAnimation}
                activeAnimationTab={activeAnimationTab}
                setActiveAnimationTab={setActiveAnimationTab}
                isDarkMode={isDarkMode}
            />
        );
    }

    // Render element-specific properties
    switch (selectedElement.type) {
        case 'video':
            return (
                <VideoProperties
                    element={selectedElement as VideoElement}
                    pageId={currentPageId}
                    updateElement={updateElement}
                    deleteElement={deleteElement}
                    duplicateElement={duplicateElement}
                    isDarkMode={isDarkMode}
                />
            );
        case 'audio':
            return (
                <AudioProperties
                    element={selectedElement as AudioElement}
                    pageId={currentPageId}
                    updateElement={updateElement}
                    deleteElement={deleteElement}
                    duplicateElement={duplicateElement}
                    isDarkMode={isDarkMode}
                />
            );
        case 'image':
            return (
                <ImageProperties
                    element={selectedElement as ImageElement}
                    pageId={currentPageId}
                    updateElement={updateElement}
                    deleteElement={deleteElement}
                    duplicateElement={duplicateElement}
                    isDarkMode={isDarkMode}
                />
            );
        default:
            return (
                <DefaultProperties
                    element={selectedElement}
                    pageId={currentPageId}
                    updateElement={updateElement}
                    deleteElement={deleteElement}
                    duplicateElement={duplicateElement}
                    isDarkMode={isDarkMode}
                />
            );
    }
}

// Page Properties Component
function PageProperties({
    page,
    updatePage,
    showLayoutDropdown,
    setShowLayoutDropdown,
    showAnimation,
    setShowAnimation,
    activeAnimationTab,
    setActiveAnimationTab,
    isDarkMode
}: {
    page: any;
    updatePage: any;
    showLayoutDropdown: boolean;
    setShowLayoutDropdown: (v: boolean) => void;
    showAnimation: boolean;
    setShowAnimation: (v: boolean) => void;
    activeAnimationTab: 'enter' | 'emphasis' | 'exit';
    setActiveAnimationTab: (t: 'enter' | 'emphasis' | 'exit') => void;
    isDarkMode: boolean;
}) {
    return (
        <aside className={cn(
            "w-72 border-l overflow-y-auto",
            isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
        )}>
            <div className="p-4">
                {/* Page header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "text-sm font-medium",
                            isDarkMode ? "text-white" : "text-gray-900"
                        )}>
                            Page 1
                        </span>
                        <Pencil className="w-3.5 h-3.5 text-gray-400 cursor-pointer" />
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 mb-6">
                    <ActionButton icon={Copy} label="Duplicate" />
                    <ActionButton icon={AlignLeft} label="Align Left" />
                    <ActionButton icon={AlignRight} label="Align Right" />
                    <ActionButton icon={Trash2} label="Delete" variant="danger" />
                </div>

                {/* Layout */}
                <div className="mb-4">
                    <label className={cn(
                        "block text-xs font-medium mb-2",
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                    )}>
                        Layout
                    </label>
                    <div className="relative">
                        <button
                            onClick={() => setShowLayoutDropdown(!showLayoutDropdown)}
                            className={cn(
                                "w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm",
                                isDarkMode
                                    ? "bg-gray-800 border-gray-700 text-white"
                                    : "bg-white border-gray-200 text-gray-700"
                            )}
                        >
                            <span>1</span>
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        </button>
                        {showLayoutDropdown && (
                            <LayoutDropdown
                                onSelect={(layout) => {
                                    updatePage(page.id, { layout });
                                    setShowLayoutDropdown(false);
                                }}
                                isDarkMode={isDarkMode}
                            />
                        )}
                    </div>
                </div>

                {/* Background */}
                <div className="mb-4">
                    <label className={cn(
                        "block text-xs font-medium mb-2",
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                    )}>
                        Background
                    </label>
                    <div className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-lg border mb-2",
                        isDarkMode
                            ? "bg-gray-800 border-gray-700"
                            : "bg-white border-gray-200"
                    )}>
                        <span className={cn("text-sm", isDarkMode ? "text-white" : "text-gray-700")}>
                            Color
                        </span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={page?.backgroundColor || '#FCFAFF'}
                        onChange={(e) => updatePage(page.id, { backgroundColor: e.target.value })}
                        className={cn(
                            "w-full px-3 py-2 rounded-lg border text-sm",
                            isDarkMode
                                ? "bg-gray-800 border-gray-700 text-white"
                                : "bg-white border-gray-200 text-gray-700"
                        )}
                    />
                </div>

                {/* Duration */}
                <div className="mb-4">
                    <label className={cn(
                        "block text-xs font-medium mb-2",
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                    )}>
                        Duration
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={formatTime(page?.duration || 600)}
                            className={cn(
                                "flex-1 px-3 py-2 rounded-lg border text-sm",
                                isDarkMode
                                    ? "bg-gray-800 border-gray-700 text-white"
                                    : "bg-white border-gray-200 text-gray-700"
                            )}
                        />
                        <span className="text-xs text-gray-400">hr:min:sec</span>
                    </div>
                </div>

                {/* Animation */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <label className={cn(
                            "text-xs font-medium",
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                        )}>
                            Animation
                        </label>
                        <button
                            onClick={() => setShowAnimation(!showAnimation)}
                            className="p-1 hover:bg-gray-100 rounded"
                        >
                            <Plus className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>

                    {showAnimation && (
                        <>
                            <div className="flex items-center gap-2 mb-3">
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                                <span className={cn("text-sm", isDarkMode ? "text-white" : "text-gray-700")}>
                                    Fade In
                                </span>
                                <button className="ml-auto p-1 hover:bg-gray-100 rounded">
                                    <Trash2 className="w-3.5 h-3.5 text-gray-400" />
                                </button>
                            </div>
                            <div className="flex items-center gap-2 pl-6">
                                <span className="text-xs text-gray-400">Duration</span>
                                <input
                                    type="text"
                                    defaultValue="1.5"
                                    className={cn(
                                        "w-16 px-2 py-1 rounded border text-sm text-center",
                                        isDarkMode
                                            ? "bg-gray-800 border-gray-700 text-white"
                                            : "bg-white border-gray-200 text-gray-700"
                                    )}
                                />
                                <div className="flex flex-col">
                                    <button className="p-0.5 hover:bg-gray-100">
                                        <ChevronDown className="w-3 h-3 text-gray-400 rotate-180" />
                                    </button>
                                    <button className="p-0.5 hover:bg-gray-100">
                                        <ChevronDown className="w-3 h-3 text-gray-400" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Layout Selection Panel */}
            <div className={cn(
                "border-t p-4",
                isDarkMode ? "border-gray-700" : "border-gray-200"
            )}>
                <h3 className={cn(
                    "text-xs font-medium mb-3",
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                )}>
                    Select Layout
                </h3>
                <div className="grid grid-cols-4 gap-2">
                    {layoutGrids.map((grid, idx) => (
                        <button
                            key={idx}
                            className={cn(
                                "aspect-square border rounded p-1 hover:border-cyan-400 transition-colors",
                                isDarkMode ? "border-gray-700" : "border-gray-200"
                            )}
                        >
                            <div
                                className="w-full h-full grid gap-0.5"
                                style={{
                                    gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
                                    gridTemplateRows: `repeat(${grid.rows}, 1fr)`
                                }}
                            >
                                {Array.from({ length: grid.cols * grid.rows }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "rounded-sm",
                                            isDarkMode ? "bg-gray-700" : "bg-gray-200"
                                        )}
                                    />
                                ))}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Animation Selection Panel */}
            <div className={cn(
                "border-t p-4",
                isDarkMode ? "border-gray-700" : "border-gray-200"
            )}>
                <h3 className={cn(
                    "text-xs font-medium mb-3",
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                )}>
                    Animation
                </h3>
                <div className="flex gap-1 mb-4">
                    {(['enter', 'emphasis', 'exit'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveAnimationTab(tab)}
                            className={cn(
                                "flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1",
                                activeAnimationTab === tab
                                    ? "bg-cyan-100 text-cyan-600"
                                    : isDarkMode
                                        ? "text-gray-400 hover:bg-gray-800"
                                        : "text-gray-500 hover:bg-gray-100"
                            )}
                        >
                            {tab === 'enter' && <ArrowRight className="w-3 h-3" />}
                            {tab === 'emphasis' && <span className="text-base">≡</span>}
                            {tab === 'exit' && <ArrowRight className="w-3 h-3 rotate-180" />}
                            <span className="capitalize">{tab === 'enter' ? 'Enter' : tab === 'emphasis' ? 'Emphasis' : 'Exit'}</span>
                        </button>
                    ))}
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {enterAnimations.map((anim) => (
                        <button
                            key={anim.id}
                            className={cn(
                                "flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 transition-colors",
                                isDarkMode && "hover:bg-gray-800"
                            )}
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-full border-2",
                                isDarkMode ? "border-gray-700" : "border-gray-200"
                            )} />
                            <span className={cn(
                                "text-[9px] text-center",
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                            )}>
                                {anim.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </aside>
    );
}

// Video Properties Component
function VideoProperties({
    element,
    pageId,
    updateElement,
    deleteElement,
    duplicateElement,
    isDarkMode
}: {
    element: VideoElement;
    pageId: string;
    updateElement: any;
    deleteElement: any;
    duplicateElement: any;
    isDarkMode: boolean;
}) {
    return (
        <aside className={cn(
            "w-72 border-l overflow-y-auto",
            isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
        )}>
            <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "text-sm font-medium",
                            isDarkMode ? "text-white" : "text-gray-900"
                        )}>
                            Video.mp4
                        </span>
                        <Pencil className="w-3.5 h-3.5 text-gray-400 cursor-pointer" />
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 mb-6">
                    <ActionButton
                        icon={Copy}
                        label="Duplicate"
                        onClick={() => duplicateElement(pageId, element.id)}
                    />
                    <ActionButton icon={AlignLeft} label="Trim Start" />
                    <ActionButton icon={AlignRight} label="Trim End" />
                    <ActionButton
                        icon={Trash2}
                        label="Delete"
                        variant="danger"
                        onClick={() => deleteElement(pageId, element.id)}
                    />
                </div>

                {/* Thumbnail preview */}
                <div className={cn(
                    "relative mb-4 rounded-lg overflow-hidden border",
                    isDarkMode ? "border-gray-700" : "border-gray-200"
                )}>
                    <div className="aspect-video bg-gray-100 flex items-center justify-center">
                        <div className="w-16 h-16 bg-gray-300 rounded" />
                    </div>
                    <button className="absolute top-2 right-2 p-1 bg-white/80 rounded">
                        <span className="text-xs">×</span>
                    </button>
                </div>

                {/* Fill dropdown */}
                <div className="mb-4">
                    <div className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-lg border",
                        isDarkMode
                            ? "bg-gray-800 border-gray-700"
                            : "bg-white border-gray-200"
                    )}>
                        <span className={cn("text-sm", isDarkMode ? "text-white" : "text-gray-700")}>
                            Fill
                        </span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                </div>

                {/* Duration */}
                <div className="mb-4">
                    <label className={cn(
                        "block text-xs font-medium mb-2",
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                    )}>
                        Duration
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={formatTime(element.duration || 600)}
                            className={cn(
                                "flex-1 px-3 py-2 rounded-lg border text-sm",
                                isDarkMode
                                    ? "bg-gray-800 border-gray-700 text-white"
                                    : "bg-white border-gray-200 text-gray-700"
                            )}
                        />
                        <span className="text-xs text-gray-400">hr:min:sec</span>
                    </div>
                </div>

                {/* Volume */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Volume2 className="w-4 h-4 text-gray-400" />
                            <span className={cn(
                                "text-xs font-medium",
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                            )}>
                                Volume
                            </span>
                        </div>
                        <span className={cn(
                            "text-sm",
                            isDarkMode ? "text-white" : "text-gray-700"
                        )}>
                            {element.volume}%
                        </span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={element.volume}
                        onChange={(e) => updateElement(pageId, element.id, { volume: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                </div>

                {/* Free Position */}
                <div className="flex items-center justify-between mb-4">
                    <span className={cn(
                        "text-sm",
                        isDarkMode ? "text-white" : "text-gray-700"
                    )}>
                        Free Position
                    </span>
                    <button
                        onClick={() => updateElement(pageId, element.id, { freePosition: !element.freePosition })}
                        className={cn(
                            "w-10 h-6 rounded-full transition-colors",
                            element.freePosition ? "bg-cyan-500" : "bg-gray-300"
                        )}
                    >
                        <div className={cn(
                            "w-4 h-4 bg-white rounded-full transition-transform mx-1",
                            element.freePosition && "translate-x-4"
                        )} />
                    </button>
                </div>

                {/* Animation */}
                <div className="flex items-center justify-between">
                    <span className={cn(
                        "text-sm",
                        isDarkMode ? "text-white" : "text-gray-700"
                    )}>
                        Animation
                    </span>
                    <button className="p-1 hover:bg-gray-100 rounded">
                        <Plus className="w-4 h-4 text-gray-400" />
                    </button>
                </div>
            </div>
        </aside>
    );
}

// Audio Properties Component
function AudioProperties({
    element,
    pageId,
    updateElement,
    deleteElement,
    duplicateElement,
    isDarkMode
}: {
    element: AudioElement;
    pageId: string;
    updateElement: any;
    deleteElement: any;
    duplicateElement: any;
    isDarkMode: boolean;
}) {
    return (
        <aside className={cn(
            "w-72 border-l overflow-y-auto",
            isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
        )}>
            <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "text-sm font-medium",
                            isDarkMode ? "text-white" : "text-gray-900"
                        )}>
                            Audio.mp3
                        </span>
                        <Pencil className="w-3.5 h-3.5 text-gray-400 cursor-pointer" />
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 mb-6">
                    <ActionButton
                        icon={Copy}
                        label="Duplicate"
                        onClick={() => duplicateElement(pageId, element.id)}
                    />
                    <ActionButton icon={AlignLeft} label="Trim Start" />
                    <ActionButton icon={AlignRight} label="Trim End" />
                    <ActionButton
                        icon={Trash2}
                        label="Delete"
                        variant="danger"
                        onClick={() => deleteElement(pageId, element.id)}
                    />
                </div>

                {/* Duration */}
                <div className="mb-4">
                    <label className={cn(
                        "block text-xs font-medium mb-2",
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                    )}>
                        Duration
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={formatTime(element.duration || 600)}
                            className={cn(
                                "flex-1 px-3 py-2 rounded-lg border text-sm",
                                isDarkMode
                                    ? "bg-gray-800 border-gray-700 text-white"
                                    : "bg-white border-gray-200 text-gray-700"
                            )}
                        />
                        <span className="text-xs text-gray-400">hr:min:sec</span>
                    </div>
                </div>

                {/* Volume */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Volume2 className="w-4 h-4 text-gray-400" />
                            <span className={cn(
                                "text-xs font-medium",
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                            )}>
                                Volume
                            </span>
                        </div>
                        <span className={cn(
                            "text-sm",
                            isDarkMode ? "text-white" : "text-gray-700"
                        )}>
                            {element.volume}%
                        </span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={element.volume}
                        onChange={(e) => updateElement(pageId, element.id, { volume: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                </div>

                {/* Fade In */}
                <div className="mb-4">
                    <label className={cn(
                        "block text-xs font-medium mb-2",
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                    )}>
                        Fade In
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={element.fadeIn || '1.5'}
                            onChange={(e) => updateElement(pageId, element.id, { fadeIn: parseFloat(e.target.value) })}
                            className={cn(
                                "flex-1 px-3 py-2 rounded-lg border text-sm",
                                isDarkMode
                                    ? "bg-gray-800 border-gray-700 text-white"
                                    : "bg-white border-gray-200 text-gray-700"
                            )}
                        />
                        <span className="text-xs text-gray-400">s</span>
                        <div className="flex flex-col">
                            <button className="p-0.5 hover:bg-gray-100">
                                <ChevronDown className="w-3 h-3 text-gray-400 rotate-180" />
                            </button>
                            <button className="p-0.5 hover:bg-gray-100">
                                <ChevronDown className="w-3 h-3 text-gray-400" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Fade Out */}
                <div className="mb-4">
                    <label className={cn(
                        "block text-xs font-medium mb-2",
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                    )}>
                        Fade Out
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={element.fadeOut || '1.5'}
                            onChange={(e) => updateElement(pageId, element.id, { fadeOut: parseFloat(e.target.value) })}
                            className={cn(
                                "flex-1 px-3 py-2 rounded-lg border text-sm",
                                isDarkMode
                                    ? "bg-gray-800 border-gray-700 text-white"
                                    : "bg-white border-gray-200 text-gray-700"
                            )}
                        />
                        <span className="text-xs text-gray-400">s</span>
                        <div className="flex flex-col">
                            <button className="p-0.5 hover:bg-gray-100">
                                <ChevronDown className="w-3 h-3 text-gray-400 rotate-180" />
                            </button>
                            <button className="p-0.5 hover:bg-gray-100">
                                <ChevronDown className="w-3 h-3 text-gray-400" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}

// Image Properties Component
function ImageProperties({
    element,
    pageId,
    updateElement,
    deleteElement,
    duplicateElement,
    isDarkMode
}: {
    element: ImageElement;
    pageId: string;
    updateElement: any;
    deleteElement: any;
    duplicateElement: any;
    isDarkMode: boolean;
}) {
    return (
        <aside className={cn(
            "w-72 border-l overflow-y-auto",
            isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
        )}>
            <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "text-sm font-medium",
                            isDarkMode ? "text-white" : "text-gray-900"
                        )}>
                            Image.png
                        </span>
                        <Pencil className="w-3.5 h-3.5 text-gray-400 cursor-pointer" />
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 mb-6">
                    <ActionButton
                        icon={Copy}
                        label="Duplicate"
                        onClick={() => duplicateElement(pageId, element.id)}
                    />
                    <ActionButton icon={AlignLeft} label="Trim Start" />
                    <ActionButton icon={AlignRight} label="Trim End" />
                    <ActionButton
                        icon={Trash2}
                        label="Delete"
                        variant="danger"
                        onClick={() => deleteElement(pageId, element.id)}
                    />
                </div>

                {/* Thumbnail preview */}
                <div className={cn(
                    "relative mb-4 rounded-lg overflow-hidden border",
                    isDarkMode ? "border-gray-700" : "border-gray-200"
                )}>
                    <div className="aspect-video bg-gray-100 flex items-center justify-center">
                        <div className="w-16 h-16 bg-gray-300 rounded" />
                    </div>
                    <button className="absolute top-2 right-2 p-1 bg-white/80 rounded">
                        <span className="text-xs">×</span>
                    </button>
                </div>

                {/* Fill dropdown */}
                <div className="mb-4">
                    <div className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-lg border",
                        isDarkMode
                            ? "bg-gray-800 border-gray-700"
                            : "bg-white border-gray-200"
                    )}>
                        <span className={cn("text-sm", isDarkMode ? "text-white" : "text-gray-700")}>
                            Fill
                        </span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                </div>

                {/* Duration */}
                <div className="mb-4">
                    <label className={cn(
                        "block text-xs font-medium mb-2",
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                    )}>
                        Duration
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={formatTime(element.duration || 600)}
                            className={cn(
                                "flex-1 px-3 py-2 rounded-lg border text-sm",
                                isDarkMode
                                    ? "bg-gray-800 border-gray-700 text-white"
                                    : "bg-white border-gray-200 text-gray-700"
                            )}
                        />
                        <span className="text-xs text-gray-400">hr:min:sec</span>
                    </div>
                </div>

                {/* Free Position */}
                <div className="flex items-center justify-between mb-4">
                    <span className={cn(
                        "text-sm",
                        isDarkMode ? "text-white" : "text-gray-700"
                    )}>
                        Free Position
                    </span>
                    <button
                        onClick={() => updateElement(pageId, element.id, { freePosition: !element.freePosition })}
                        className={cn(
                            "w-10 h-6 rounded-full transition-colors",
                            element.freePosition ? "bg-cyan-500" : "bg-gray-300"
                        )}
                    >
                        <div className={cn(
                            "w-4 h-4 bg-white rounded-full transition-transform mx-1",
                            element.freePosition && "translate-x-4"
                        )} />
                    </button>
                </div>

                {/* Position (when free position is on) */}
                {element.freePosition && (
                    <>
                        <div className="mb-4">
                            <label className={cn(
                                "block text-xs font-medium mb-2",
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                            )}>
                                Position
                            </label>
                            <div className="flex gap-4 mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400">X-Axis</span>
                                        <input
                                            type="number"
                                            value={Math.round(element.position.x)}
                                            onChange={(e) => updateElement(pageId, element.id, {
                                                position: { ...element.position, x: parseInt(e.target.value) }
                                            })}
                                            className={cn(
                                                "w-16 px-2 py-1 rounded border text-sm",
                                                isDarkMode
                                                    ? "bg-gray-800 border-gray-700 text-white"
                                                    : "bg-white border-gray-200 text-gray-700"
                                            )}
                                        />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400">Y-Axis</span>
                                        <input
                                            type="number"
                                            value={Math.round(element.position.y)}
                                            onChange={(e) => updateElement(pageId, element.id, {
                                                position: { ...element.position, y: parseInt(e.target.value) }
                                            })}
                                            className={cn(
                                                "w-16 px-2 py-1 rounded border text-sm",
                                                isDarkMode
                                                    ? "bg-gray-800 border-gray-700 text-white"
                                                    : "bg-white border-gray-200 text-gray-700"
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Alignment buttons */}
                            <div className="grid grid-cols-5 gap-1">
                                <button className={cn(
                                    "p-2 rounded hover:bg-gray-100",
                                    isDarkMode && "hover:bg-gray-800"
                                )}>
                                    <ArrowUp className="w-4 h-4 text-gray-400 -rotate-45" />
                                </button>
                                <button className={cn(
                                    "p-2 rounded hover:bg-gray-100",
                                    isDarkMode && "hover:bg-gray-800"
                                )}>
                                    <ArrowUp className="w-4 h-4 text-gray-400" />
                                </button>
                                <button className={cn(
                                    "p-2 rounded hover:bg-gray-100",
                                    isDarkMode && "hover:bg-gray-800"
                                )}>
                                    <ArrowUp className="w-4 h-4 text-gray-400 rotate-45" />
                                </button>
                                <div />
                                <div />
                                <button className={cn(
                                    "p-2 rounded hover:bg-gray-100",
                                    isDarkMode && "hover:bg-gray-800"
                                )}>
                                    <ArrowLeft className="w-4 h-4 text-gray-400" />
                                </button>
                                <button className={cn(
                                    "p-2 rounded hover:bg-gray-100",
                                    isDarkMode && "hover:bg-gray-800"
                                )}>
                                    <Move className="w-4 h-4 text-gray-400" />
                                </button>
                                <button className={cn(
                                    "p-2 rounded hover:bg-gray-100",
                                    isDarkMode && "hover:bg-gray-800"
                                )}>
                                    <ArrowRight className="w-4 h-4 text-gray-400" />
                                </button>
                                <div />
                                <div />
                                <button className={cn(
                                    "p-2 rounded hover:bg-gray-100",
                                    isDarkMode && "hover:bg-gray-800"
                                )}>
                                    <ArrowDown className="w-4 h-4 text-gray-400 -rotate-45" />
                                </button>
                                <button className={cn(
                                    "p-2 rounded hover:bg-gray-100",
                                    isDarkMode && "hover:bg-gray-800"
                                )}>
                                    <ArrowDown className="w-4 h-4 text-gray-400" />
                                </button>
                                <button className={cn(
                                    "p-2 rounded hover:bg-gray-100",
                                    isDarkMode && "hover:bg-gray-800"
                                )}>
                                    <ArrowDown className="w-4 h-4 text-gray-400 rotate-45" />
                                </button>
                            </div>
                        </div>

                        {/* Size */}
                        <div className="mb-4">
                            <label className={cn(
                                "block text-xs font-medium mb-2",
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                            )}>
                                Size
                            </label>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400">Width</span>
                                    <input
                                        type="number"
                                        value={Math.round(element.size.width)}
                                        onChange={(e) => updateElement(pageId, element.id, {
                                            size: { ...element.size, width: parseInt(e.target.value) }
                                        })}
                                        className={cn(
                                            "w-16 px-2 py-1 rounded border text-sm",
                                            isDarkMode
                                                ? "bg-gray-800 border-gray-700 text-white"
                                                : "bg-white border-gray-200 text-gray-700"
                                        )}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400">Height</span>
                                    <input
                                        type="number"
                                        value={Math.round(element.size.height)}
                                        onChange={(e) => updateElement(pageId, element.id, {
                                            size: { ...element.size, height: parseInt(e.target.value) }
                                        })}
                                        className={cn(
                                            "w-16 px-2 py-1 rounded border text-sm",
                                            isDarkMode
                                                ? "bg-gray-800 border-gray-700 text-white"
                                                : "bg-white border-gray-200 text-gray-700"
                                        )}
                                    />
                                </div>
                                <button className={cn(
                                    "p-1 rounded hover:bg-gray-100",
                                    isDarkMode && "hover:bg-gray-800"
                                )}>
                                    <Maximize className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </aside>
    );
}

// Default Properties Component
function DefaultProperties({
    element,
    pageId,
    updateElement,
    deleteElement,
    duplicateElement,
    isDarkMode
}: {
    element: Element;
    pageId: string;
    updateElement: any;
    deleteElement: any;
    duplicateElement: any;
    isDarkMode: boolean;
}) {
    return (
        <aside className={cn(
            "w-72 border-l overflow-y-auto",
            isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
        )}>
            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "text-sm font-medium",
                            isDarkMode ? "text-white" : "text-gray-900"
                        )}>
                            {element.name}
                        </span>
                        <Pencil className="w-3.5 h-3.5 text-gray-400 cursor-pointer" />
                    </div>
                </div>

                <div className="flex items-center gap-2 mb-6">
                    <ActionButton
                        icon={Copy}
                        label="Duplicate"
                        onClick={() => duplicateElement(pageId, element.id)}
                    />
                    <ActionButton
                        icon={Trash2}
                        label="Delete"
                        variant="danger"
                        onClick={() => deleteElement(pageId, element.id)}
                    />
                </div>
            </div>
        </aside>
    );
}

// Layout Dropdown Component
function LayoutDropdown({ onSelect, isDarkMode }: { onSelect: (layout: LayoutType) => void; isDarkMode: boolean }) {
    return (
        <div className={cn(
            "absolute top-full left-0 right-0 mt-1 rounded-lg border shadow-lg z-50",
            isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        )}>
            {layouts.map((layout) => (
                <button
                    key={layout.id}
                    onClick={() => onSelect(layout.id)}
                    className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50",
                        isDarkMode && "hover:bg-gray-700 text-white"
                    )}
                >
                    <div className={cn(
                        "w-4 h-4 border rounded",
                        isDarkMode ? "border-gray-600" : "border-gray-300"
                    )} />
                    <span>{layout.label}</span>
                </button>
            ))}
        </div>
    );
}

// Action Button Component
function ActionButton({
    icon: Icon,
    label,
    variant = 'default',
    onClick
}: {
    icon: any;
    label: string;
    variant?: 'default' | 'danger';
    onClick?: () => void;
}) {
    return (
        <button
            onClick={onClick}
            title={label}
            className={cn(
                "p-2 rounded-lg border transition-colors",
                variant === 'danger'
                    ? "border-red-200 text-red-500 hover:bg-red-50"
                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
            )}
        >
            <Icon className="w-4 h-4" />
        </button>
    );
}
