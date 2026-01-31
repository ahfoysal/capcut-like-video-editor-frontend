'use client';

import { useRef, useState } from 'react';
import { Grid3X3 } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { cn } from '@/lib/utils';
import { Element, ImageElement, VideoElement, TextElement, QRCodeElement } from '@/types/editor';
import { generateId } from '@/lib/utils';

export default function Canvas() {
    const {
        pages,
        currentPageId,
        selectedElementId,
        setSelectedElement,
        updateElement,
        addElement,
        zoom,
        isDarkMode
    } = useEditorStore();

    const canvasRef = useRef<HTMLDivElement>(null);
    const [showGrid, setShowGrid] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const currentPage = pages.find(p => p.id === currentPageId);
    const elements = currentPage?.elements || [];
    const scale = zoom / 100;

    const handleCanvasClick = (e: React.MouseEvent) => {
        if (e.target === canvasRef.current || (e.target as HTMLElement).dataset.canvas) {
            setSelectedElement(null);
        }
    };

    const handleElementMouseDown = (e: React.MouseEvent, element: Element) => {
        e.stopPropagation();
        setSelectedElement(element.id);

        if (element.freePosition) {
            setIsDragging(true);
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !selectedElementId || !canvasRef.current) return;

        const canvasRect = canvasRef.current.getBoundingClientRect();
        const element = elements.find(el => el.id === selectedElementId);

        if (element?.freePosition) {
            const x = (e.clientX - canvasRect.left - dragOffset.x) / scale;
            const y = (e.clientY - canvasRect.top - dragOffset.y) / scale;

            updateElement(currentPageId, selectedElementId, {
                position: { x: Math.max(0, x), y: Math.max(0, y) }
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const resourceData = e.dataTransfer.getData('resource');
        if (resourceData && canvasRef.current) {
            const resource = JSON.parse(resourceData);
            const canvasRect = canvasRef.current.getBoundingClientRect();
            const x = (e.clientX - canvasRect.left) / scale;
            const y = (e.clientY - canvasRect.top) / scale;

            const baseElement = {
                id: generateId(),
                name: resource.name,
                position: { x, y },
                size: { width: 200, height: 150 },
                duration: resource.duration || 10,
                startTime: 0,
                freePosition: true,
            };

            if (resource.type === 'image') {
                addElement(currentPageId, {
                    ...baseElement,
                    type: 'image',
                    src: resource.src,
                    fill: 'fill',
                } as ImageElement);
            } else if (resource.type === 'video') {
                addElement(currentPageId, {
                    ...baseElement,
                    type: 'video',
                    src: resource.src,
                    volume: 75,
                    fill: 'fill',
                    thumbnail: resource.thumbnail,
                } as VideoElement);
            }
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    // Get non-audio elements for visual layout
    const visualElements = elements.filter(el => el.type !== 'audio');
    const textElements = elements.filter(el => el.type === 'text' && !el.freePosition);

    return (
        <div
            className={cn(
                "flex-1 flex flex-col overflow-hidden",
                isDarkMode ? "bg-gray-800" : "bg-gray-100"
            )}
        >
            {/* Toolbar */}
            <div className={cn(
                "flex items-center justify-start p-2 border-b",
                isDarkMode ? "border-gray-700" : "border-gray-200"
            )}>
                <button
                    onClick={() => setShowGrid(!showGrid)}
                    className={cn(
                        "p-2 rounded-lg transition-colors",
                        showGrid
                            ? "bg-cyan-100 text-cyan-600"
                            : isDarkMode
                                ? "text-gray-400 hover:bg-gray-700"
                                : "text-gray-500 hover:bg-gray-200"
                    )}
                >
                    <Grid3X3 className="w-5 h-5" />
                </button>
            </div>

            {/* Canvas area */}
            <div
                className="flex-1 flex items-center justify-center p-4 overflow-auto"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <div
                    ref={canvasRef}
                    data-canvas="true"
                    onClick={handleCanvasClick}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="relative shadow-xl rounded-lg overflow-hidden"
                    style={{
                        width: 640 * scale,
                        height: 360 * scale,
                        backgroundColor: currentPage?.backgroundColor || '#FCFAFF',
                        backgroundImage: showGrid
                            ? `linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), 
                 linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)`
                            : undefined,
                        backgroundSize: showGrid ? `${20 * scale}px ${20 * scale}px` : undefined,
                    }}
                >
                    {/* Layout based rendering */}
                    {currentPage?.layout === '2:1-h' ? (
                        <div className="absolute inset-0 flex" data-canvas="true">
                            {/* Left side - first visual element */}
                            <div className="flex-1 relative overflow-hidden" data-canvas="true">
                                {visualElements[0] && renderElement(visualElements[0], scale, selectedElementId, handleElementMouseDown, true)}
                            </div>
                            {/* Right side - second visual element or QR code */}
                            <div className="flex-1 relative overflow-hidden flex items-center justify-center" data-canvas="true">
                                {visualElements[1] && renderElement(visualElements[1], scale, selectedElementId, handleElementMouseDown, true)}
                            </div>
                        </div>
                    ) : currentPage?.layout === '1:2-v' ? (
                        <div className="absolute inset-0 flex flex-col" data-canvas="true">
                            <div className="flex-1 relative overflow-hidden" data-canvas="true">
                                {visualElements[0] && renderElement(visualElements[0], scale, selectedElementId, handleElementMouseDown, true)}
                            </div>
                            <div className="flex-1 relative overflow-hidden" data-canvas="true">
                                {visualElements[1] && renderElement(visualElements[1], scale, selectedElementId, handleElementMouseDown, true)}
                            </div>
                        </div>
                    ) : (
                        <div className="absolute inset-0" data-canvas="true">
                            {visualElements.map((el) => renderElement(el, scale, selectedElementId, handleElementMouseDown, !el.freePosition))}
                        </div>
                    )}

                    {/* Text overlay at bottom */}
                    {textElements.map((textEl) => {
                        const el = textEl as TextElement;
                        return (
                            <div
                                key={el.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedElement(el.id);
                                }}
                                className={cn(
                                    "absolute left-0 right-0 bottom-0 flex items-center justify-center cursor-pointer",
                                    selectedElementId === el.id && "ring-2 ring-cyan-400"
                                )}
                                style={{
                                    height: el.size.height * scale,
                                    backgroundColor: el.backgroundColor,
                                }}
                            >
                                <p style={{
                                    fontSize: el.fontSize * scale,
                                    fontWeight: el.fontWeight,
                                    color: el.color,
                                }}>
                                    {el.content}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// Render individual element
function renderElement(
    element: Element,
    scale: number,
    selectedElementId: string | null,
    handleElementMouseDown: (e: React.MouseEvent, el: Element) => void,
    fillContainer: boolean = false
) {
    const isSelected = selectedElementId === element.id;

    const baseStyle: React.CSSProperties = element.freePosition
        ? {
            position: 'absolute',
            left: element.position.x * scale,
            top: element.position.y * scale,
            width: element.size.width * scale,
            height: element.size.height * scale,
        }
        : fillContainer
            ? { width: '100%', height: '100%' }
            : {
                position: 'absolute',
                left: element.position.x * scale,
                top: element.position.y * scale,
                width: element.size.width * scale,
                height: element.size.height * scale,
            };

    const wrapperClasses = cn(
        "relative cursor-pointer transition-all",
        isSelected && "ring-2 ring-cyan-400 ring-offset-2 z-10"
    );

    switch (element.type) {
        case 'image':
            const imgEl = element as ImageElement;
            return (
                <div
                    key={element.id}
                    className={wrapperClasses}
                    style={baseStyle}
                    onMouseDown={(e) => handleElementMouseDown(e, element)}
                >
                    <img
                        src={imgEl.src}
                        alt={imgEl.name}
                        className="w-full h-full object-cover"
                        draggable={false}
                    />
                    {isSelected && <SelectionHandles />}
                </div>
            );

        case 'video':
            const vidEl = element as VideoElement;
            return (
                <div
                    key={element.id}
                    className={wrapperClasses}
                    style={baseStyle}
                    onMouseDown={(e) => handleElementMouseDown(e, element)}
                >
                    <img
                        src={vidEl.thumbnail || vidEl.src}
                        alt={vidEl.name}
                        className="w-full h-full object-cover"
                        draggable={false}
                    />
                    {isSelected && <SelectionHandles />}
                </div>
            );

        case 'text':
            const textEl = element as TextElement;
            if (!element.freePosition) return null; // Handled separately for bottom overlay
            return (
                <div
                    key={element.id}
                    className={cn(wrapperClasses, "flex items-center justify-center")}
                    style={{
                        ...baseStyle,
                        fontSize: textEl.fontSize * scale,
                        fontWeight: textEl.fontWeight,
                        color: textEl.color,
                        backgroundColor: textEl.backgroundColor,
                    }}
                    onMouseDown={(e) => handleElementMouseDown(e, element)}
                >
                    {textEl.content}
                    {isSelected && <SelectionHandles />}
                </div>
            );

        case 'qrcode':
            const qrEl = element as QRCodeElement;
            return (
                <div
                    key={element.id}
                    className={cn(wrapperClasses, "flex flex-col items-center justify-center")}
                    style={baseStyle}
                    onMouseDown={(e) => handleElementMouseDown(e, element)}
                >
                    <div
                        className="bg-white p-3 rounded shadow-sm flex flex-col items-center"
                        style={{
                            width: element.size.width * scale * 0.9,
                            height: element.size.height * scale * 0.9
                        }}
                    >
                        {/* QR Code Grid */}
                        <div
                            className="flex-1 w-full grid gap-px mb-2"
                            style={{
                                gridTemplateColumns: 'repeat(10, 1fr)',
                                gridTemplateRows: 'repeat(10, 1fr)',
                            }}
                        >
                            {Array.from({ length: 100 }).map((_, i) => {
                                // Generate a pattern that looks like a QR code
                                const isCorner = (i < 30 && i % 10 < 3) ||
                                    (i < 30 && i % 10 > 6) ||
                                    (i > 69 && i % 10 < 3);
                                const isRandom = Math.random() > 0.5;
                                return (
                                    <div
                                        key={i}
                                        className={cn(
                                            isCorner ? "bg-black" : isRandom ? "bg-black" : "bg-white"
                                        )}
                                    />
                                );
                            })}
                        </div>
                        {qrEl.title && (
                            <p
                                className="text-center text-gray-600"
                                style={{ fontSize: 10 * scale }}
                            >
                                {qrEl.title}
                            </p>
                        )}
                    </div>
                    {isSelected && <SelectionHandles />}
                </div>
            );

        default:
            return null;
    }
}

// Selection handles component
function SelectionHandles() {
    return (
        <>
            {/* Corner handles */}
            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-cyan-400 rounded-full cursor-nw-resize shadow-sm" />
            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-cyan-400 rounded-full cursor-ne-resize shadow-sm" />
            <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-cyan-400 rounded-full cursor-sw-resize shadow-sm" />
            <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-cyan-400 rounded-full cursor-se-resize shadow-sm" />
            {/* Edge handles */}
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-cyan-400 rounded-full cursor-n-resize shadow-sm" />
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-cyan-400 rounded-full cursor-s-resize shadow-sm" />
            <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-white border-2 border-cyan-400 rounded-full cursor-w-resize shadow-sm" />
            <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-white border-2 border-cyan-400 rounded-full cursor-e-resize shadow-sm" />
        </>
    );
}
