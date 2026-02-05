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
        signature: 'Click to sign',
        date: 'Select date',
        text: 'Enter text',
        checkbox: 'Checkbox',
        radio: 'Radio',
        image: 'Upload image',
        hyperlink: 'Enter URL',
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

// Field content renderer based on type
function FieldContent({
    field,
    onUpdate,
    isPreview
}: {
    field: Field;
    onUpdate: (value: string) => void;
    isPreview: boolean;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(field.value || '');

    // Handle text field
    if (field.type === 'text') {
        if (isPreview && field.value) {
            return <span className="text-sm px-2">{field.value}</span>;
        }
        if (isEditing || field.value) {
            return (
                <input
                    type="text"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onBlur={() => {
                        onUpdate(tempValue);
                        setIsEditing(false);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            onUpdate(tempValue);
                            setIsEditing(false);
                        }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="w-full h-full bg-transparent text-sm px-2 outline-none border-none"
                    placeholder="Enter text..."
                    autoFocus={isEditing}
                />
            );
        }
        return (
            <span
                className="text-sm opacity-75 cursor-text"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                }}
            >
                {getFieldLabel(field.type)}
            </span>
        );
    }

    // Handle date field
    if (field.type === 'date') {
        // Format date for display
        const formatDate = (dateStr: string) => {
            try {
                const date = new Date(dateStr);
                return date.toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                });
            } catch {
                return dateStr;
            }
        };

        if (isPreview && field.value) {
            return <span className="text-sm px-2">{formatDate(field.value)}</span>;
        }
        return (
            <input
                type="date"
                value={field.value || new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                    onUpdate(e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-full h-full bg-transparent text-sm px-2 outline-none border-none cursor-pointer"
            />
        );
    }

    // Handle checkbox field
    if (field.type === 'checkbox') {
        return (
            <div
                className="flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <input
                    type="checkbox"
                    checked={field.value === 'true'}
                    onChange={(e) => {
                        onUpdate(e.target.checked ? 'true' : '');
                    }}
                    className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    disabled={isPreview}
                />
                <span className="text-sm">Checkbox</span>
            </div>
        );
    }

    // Handle radio field
    if (field.type === 'radio') {
        return (
            <div
                className="flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <input
                    type="radio"
                    checked={field.value === 'true'}
                    onChange={(e) => {
                        onUpdate(e.target.checked ? 'true' : '');
                    }}
                    className="w-5 h-5 border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    disabled={isPreview}
                />
                <span className="text-sm">Radio</span>
            </div>
        );
    }

    // Handle image field
    if (field.type === 'image') {
        if (field.value) {
            return <img src={field.value} alt="Uploaded" className="max-w-full max-h-full object-contain" />;
        }
        return (
            <label
                className="flex flex-col items-center gap-1 cursor-pointer"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                                onUpdate(event.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                        }
                    }}
                    disabled={isPreview}
                />
                <svg className="w-6 h-6 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs opacity-75">Upload Image</span>
            </label>
        );
    }

    // Handle hyperlink field
    if (field.type === 'hyperlink') {
        if (isPreview && field.value) {
            return (
                <a
                    href={field.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm px-2 text-blue-600 underline"
                >
                    {field.value}
                </a>
            );
        }
        return (
            <input
                type="url"
                value={field.value || ''}
                onChange={(e) => onUpdate(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-full h-full bg-transparent text-sm px-2 outline-none border-none"
                placeholder="https://example.com"
            />
        );
    }

    // Handle signature field (click to open modal - handled by parent)
    if (field.type === 'signature') {
        if (field.value) {
            return <img src={field.value} alt="Signature" className="max-w-full max-h-full pointer-events-none" />;
        }
        return <span className="text-sm opacity-75 pointer-events-none">{getFieldLabel(field.type)}</span>;
    }

    // Default fallback
    if (field.value) {
        return <span className="text-sm px-2">{field.value}</span>;
    }
    return <span className="text-sm opacity-75">{getFieldLabel(field.type)}</span>;
}

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
        // Don't start drag if clicking on an interactive element
        if ((e.target as HTMLElement).tagName === 'INPUT' ||
            (e.target as HTMLElement).tagName === 'LABEL') {
            return;
        }
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

    const handleFieldValueUpdate = useCallback((fieldId: string, value: string) => {
        onFieldUpdate(fieldId, { value });
    }, [onFieldUpdate]);

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
                            isPreview && 'cursor-default border-transparent',
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
                        <FieldContent
                            field={field}
                            onUpdate={(value) => handleFieldValueUpdate(field.id, value)}
                            isPreview={isPreview}
                        />

                        {/* Required indicator */}
                        {field.required && !field.value && !isPreview && (
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
