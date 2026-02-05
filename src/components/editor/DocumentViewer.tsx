'use client';

import { useRef, useState, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';
import PdfRenderer from './PdfRenderer';

interface Field {
    id: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    page: number;
    value?: string;
    required: boolean;
}

interface DocumentViewerProps {
    fields: Field[];
    onFieldClick: (field: Field) => void;
    onFieldUpdate: (id: string, updates: Partial<Field>) => void;
    onFieldDelete: (id: string) => void;
    selectedFieldId?: string;
    isPreview?: boolean;
    pdfData?: ArrayBuffer | null;
    currentPage?: number;
    onPageCountChange?: (numPages: number) => void;
}

// Memoized PDF Renderer to prevent re-renders during dragging
const MemoizedPdfRenderer = memo(PdfRenderer);

const getFieldLabel = (type: string) => {
    const labels: Record<string, string> = {
        signature: 'Signature',
        date: 'Date',
        text: 'Text',
        checkbox: 'Checkbox',
        radio: 'Radio',
        image: 'Image',
        hyperlink: 'Link',
    };
    return labels[type] || type;
};

const getFieldColor = (type: string) => {
    const colors: Record<string, string> = {
        signature: 'bg-blue-50 border-blue-400 text-blue-600',
        date: 'bg-green-50 border-green-400 text-green-600',
        text: 'bg-purple-50 border-purple-400 text-purple-600',
        checkbox: 'bg-orange-50 border-orange-400 text-orange-600',
        radio: 'bg-pink-50 border-pink-400 text-pink-600',
        image: 'bg-teal-50 border-teal-400 text-teal-600',
        hyperlink: 'bg-indigo-50 border-indigo-400 text-indigo-600',
    };
    return colors[type] || 'bg-gray-50 border-gray-400 text-gray-600';
};

export default function DocumentViewer({
    fields,
    onFieldClick,
    onFieldUpdate,
    onFieldDelete,
    selectedFieldId,
    isPreview = false,
    pdfData = null,
    currentPage = 1,
    onPageCountChange,
}: DocumentViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const handleMouseDown = useCallback((e: React.MouseEvent, field: Field) => {
        if (isPreview) return;
        e.preventDefault();
        e.stopPropagation();

        const rect = e.currentTarget.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
        setDragging(field.id);
    }, [isPreview]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!dragging || !containerRef.current || isPreview) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left - dragOffset.x;
        const y = e.clientY - rect.top - dragOffset.y;

        onFieldUpdate(dragging, { x: Math.max(0, x), y: Math.max(0, y) });
    }, [dragging, dragOffset, isPreview, onFieldUpdate]);

    const handleMouseUp = useCallback(() => {
        setDragging(null);
    }, []);

    // Memoize onPageCountChange to prevent PDF re-renders
    const memoizedOnPageCountChange = useCallback((numPages: number) => {
        onPageCountChange?.(numPages);
    }, [onPageCountChange]);

    return (
        <div className="flex justify-center">
            <div
                ref={containerRef}
                className="relative bg-white shadow-lg"
                style={{ width: 612, minHeight: 792 }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* PDF Renderer */}
                <MemoizedPdfRenderer
                    pdfData={pdfData}
                    currentPage={currentPage}
                    width={612}
                    onLoadSuccess={memoizedOnPageCountChange}
                />

                {/* Fields overlay - each field positioned absolutely */}
                {fields.map((field) => (
                    <div
                        key={field.id}
                        className={cn(
                            'absolute flex items-center justify-center',
                            'border-2 border-dashed rounded cursor-move select-none',
                            getFieldColor(field.type),
                            selectedFieldId === field.id && 'ring-2 ring-primary-500 ring-offset-2',
                            isPreview && 'cursor-default',
                            dragging === field.id && 'opacity-80'
                        )}
                        style={{
                            left: field.x,
                            top: field.y,
                            width: field.width,
                            height: field.height,
                            zIndex: selectedFieldId === field.id ? 20 : 10,
                        }}
                        onClick={() => onFieldClick(field)}
                        onMouseDown={(e) => handleMouseDown(e, field)}
                    >
                        {field.value ? (
                            field.type === 'signature' ? (
                                <img src={field.value} alt="Signature" className="max-w-full max-h-full pointer-events-none" />
                            ) : (
                                <span className="text-sm px-2 pointer-events-none">{field.value}</span>
                            )
                        ) : (
                            <span className="text-sm opacity-75 pointer-events-none">{getFieldLabel(field.type)}</span>
                        )}

                        {/* Required indicator */}
                        {field.required && !field.value && (
                            <span className="absolute -top-1 -right-1 text-red-500 text-lg pointer-events-none">*</span>
                        )}

                        {/* Delete button - always visible when selected */}
                        {!isPreview && selectedFieldId === field.id && (
                            <button
                                className="absolute -top-3 -left-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md z-30"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    onFieldDelete(field.id);
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}

                        {/* Options button */}
                        {!isPreview && selectedFieldId === field.id && (
                            <button
                                className="absolute -top-3 left-4 w-6 h-6 bg-white border border-gray-200 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-md z-30"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
