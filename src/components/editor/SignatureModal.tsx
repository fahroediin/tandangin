'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SignatureModalProps {
    onClose: () => void;
    onComplete: (signatureData: string) => void;
}

export default function SignatureModal({ onClose, onComplete }: SignatureModalProps) {
    const [activeTab, setActiveTab] = useState<'sign' | 'stamp' | 'last'>('sign');
    const [color, setColor] = useState('#000000');
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set up canvas
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, [color]);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
        setHasDrawn(true);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas || !hasDrawn) return;

        const dataUrl = canvas.toDataURL('image/png');
        onComplete(dataUrl);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Tabs */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                        {(['sign', 'stamp', 'last'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    'px-4 py-1.5 text-sm font-medium rounded-md transition-colors',
                                    activeTab === tab
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                )}
                            >
                                {tab === 'sign' ? 'Sign' : tab === 'stamp' ? 'Stamp' : 'Last Used'}
                            </button>
                        ))}
                    </div>

                    <div className="w-6" /> {/* Spacer for centering */}
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeTab === 'sign' && (
                        <>
                            {/* Canvas */}
                            <div className="border border-gray-200 rounded-lg mb-4 bg-white">
                                <canvas
                                    ref={canvasRef}
                                    width={440}
                                    height={200}
                                    className="w-full cursor-crosshair"
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                />
                            </div>

                            {/* Color selector */}
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-sm text-gray-600">Color:</span>
                                <div className="flex gap-2">
                                    {['#000000', '#1e40af'].map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => setColor(c)}
                                            className={cn(
                                                'w-8 h-8 rounded-full border-2 transition-all',
                                                color === c ? 'border-primary-500 scale-110' : 'border-gray-200'
                                            )}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'stamp' && (
                        <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <button className="text-primary-600 hover:text-primary-700 font-medium">
                                Select File
                            </button>
                        </div>
                    )}

                    {activeTab === 'last' && (
                        <div className="text-center py-8 text-gray-500">
                            <p>No saved signatures</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-gray-100">
                    <button
                        onClick={clearCanvas}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        Clear
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!hasDrawn}
                        className="px-6 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
