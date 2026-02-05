'use client';

import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

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
}

export default function DocumentViewer({
    fields,
    onFieldClick,
    onFieldUpdate,
    onFieldDelete,
    selectedFieldId,
    isPreview = false,
}: DocumentViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent, field: Field) => {
        if (isPreview) return;

        const rect = e.currentTarget.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
        setDragging(field.id);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!dragging || !containerRef.current || isPreview) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left - dragOffset.x;
        const y = e.clientY - rect.top - dragOffset.y;

        onFieldUpdate(dragging, { x: Math.max(0, x), y: Math.max(0, y) });
    };

    const handleMouseUp = () => {
        setDragging(null);
    };

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

    return (
        <div className="flex justify-center">
            <div
                ref={containerRef}
                className="relative bg-white shadow-lg"
                style={{ width: 612, height: 792 }} // US Letter size at 72dpi
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* Document placeholder */}
                <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                    <div className="text-center">
                        <svg className="w-20 h-20 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm">Document Preview</p>
                        <p className="text-xs text-gray-400 mt-1">PDF content will appear here</p>
                    </div>
                </div>

                {/* Fields overlay */}
                {fields.map((field) => (
                    <div
                        key={field.id}
                        className={cn(
                            'absolute flex items-center justify-center transition-all',
                            'border-2 border-dashed rounded cursor-pointer',
                            getFieldColor(field.type),
                            selectedFieldId === field.id && 'ring-2 ring-primary-500 ring-offset-2',
                            isPreview && 'cursor-default'
                        )}
                        style={{
                            left: field.x,
                            top: field.y,
                            width: field.width,
                            height: field.height,
                        }}
                        onClick={() => onFieldClick(field)}
                        onMouseDown={(e) => handleMouseDown(e, field)}
                    >
                        {field.value ? (
                            field.type === 'signature' ? (
                                <img src={field.value} alt="Signature" className="max-w-full max-h-full" />
                            ) : (
                                <span className="text-sm px-2">{field.value}</span>
                            )
                        ) : (
                            <span className="text-sm opacity-75">{getFieldLabel(field.type)}</span>
                        )}

                        {/* Required indicator */}
                        {field.required && !field.value && (
                            <span className="absolute -top-1 -right-1 text-red-500 text-lg">*</span>
                        )}

                        {/* Delete button */}
                        {!isPreview && selectedFieldId === field.id && (
                            <button
                                className="absolute -top-3 -left-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onFieldDelete(field.id);
                                }}
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}

                        {/* Options button */}
                        {!isPreview && selectedFieldId === field.id && (
                            <button
                                className="absolute -top-3 left-4 w-6 h-6 bg-white border border-gray-200 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // Open options menu
                                }}
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
