'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface SignatureModalProps {
    onClose: () => void;
    onComplete: (signatureData: string, initialsData?: string) => void;
    mode?: 'signature' | 'initials';
}

const COLORS = [
    { name: 'Black', value: '#000000' },
    { name: 'Blue', value: '#1e40af' },
    { name: 'Red', value: '#ef4444' },
];

const FONTS = [
    { name: 'Script', value: "'Dancing Script', cursive" },
    { name: 'Elegant', value: "'Great Vibes', cursive" },
    { name: 'Classic', value: "'Tangerine', cursive" },
    { name: 'Simple', value: "'Caveat', cursive" },
];

export default function SignatureModal({ onClose, onComplete, mode = 'signature' }: SignatureModalProps) {
    const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'upload'>('draw');
    const [color, setColor] = useState('#000000');
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);
    const [isInitialsMode, setIsInitialsMode] = useState(mode === 'initials');

    // Drawing canvas refs
    const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
    const initialsCanvasRef = useRef<HTMLCanvasElement>(null);

    // Type signature state
    const [typedName, setTypedName] = useState('');
    const [selectedFont, setSelectedFont] = useState(FONTS[0].value);

    // Upload state
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);

    const currentCanvasRef = isInitialsMode ? initialsCanvasRef : signatureCanvasRef;

    // Setup canvas
    useEffect(() => {
        const canvas = currentCanvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, [color, isInitialsMode, currentCanvasRef]);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = currentCanvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;

        const canvas = currentCanvasRef.current;
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

    const clearCanvas = useCallback(() => {
        const canvas = currentCanvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
    }, [currentCanvasRef]);

    // Generate typed signature as image
    const generateTypedSignature = useCallback(() => {
        if (!typedName.trim()) return null;

        const canvas = document.createElement('canvas');
        canvas.width = 440;
        canvas.height = isInitialsMode ? 100 : 200;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.fillStyle = 'transparent';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = `${isInitialsMode ? 48 : 64}px ${selectedFont}`;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);

        return canvas.toDataURL('image/png');
    }, [typedName, selectedFont, color, isInitialsMode]);

    const handleSave = () => {
        let dataUrl: string | null = null;

        if (activeTab === 'draw') {
            const canvas = currentCanvasRef.current;
            if (!canvas || !hasDrawn) return;
            dataUrl = canvas.toDataURL('image/png');
        } else if (activeTab === 'type') {
            dataUrl = generateTypedSignature();
            if (!dataUrl) return;
        } else if (activeTab === 'upload') {
            if (!uploadedImage) return;
            dataUrl = uploadedImage;
        }

        if (dataUrl) {
            onComplete(dataUrl);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setUploadedImage(event.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const canSave = () => {
        if (activeTab === 'draw') return hasDrawn;
        if (activeTab === 'type') return typedName.trim().length > 0;
        if (activeTab === 'upload') return uploadedImage !== null;
        return false;
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

                    {/* Mode Toggle */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { setIsInitialsMode(false); clearCanvas(); }}
                            className={cn(
                                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                                !isInitialsMode
                                    ? 'bg-primary-100 text-primary-700'
                                    : 'text-gray-500 hover:text-gray-700'
                            )}
                        >
                            Signature
                        </button>
                        <button
                            onClick={() => { setIsInitialsMode(true); clearCanvas(); }}
                            className={cn(
                                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                                isInitialsMode
                                    ? 'bg-primary-100 text-primary-700'
                                    : 'text-gray-500 hover:text-gray-700'
                            )}
                        >
                            Initials
                        </button>
                    </div>

                    <div className="w-6" />
                </div>

                {/* Sub-tabs for Draw/Type/Upload */}
                <div className="flex items-center gap-1 p-4 pb-0">
                    {(['draw', 'type', 'upload'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                                activeTab === tab
                                    ? 'bg-gray-100 text-gray-900'
                                    : 'text-gray-500 hover:text-gray-700'
                            )}
                        >
                            {tab === 'draw' ? 'Draw' : tab === 'type' ? 'Type' : 'Upload'}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeTab === 'draw' && (
                        <>
                            {/* Canvas */}
                            <div className="border border-gray-200 rounded-lg mb-4 bg-white">
                                <canvas
                                    ref={currentCanvasRef}
                                    width={440}
                                    height={isInitialsMode ? 100 : 200}
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
                                    {COLORS.map((c) => (
                                        <button
                                            key={c.value}
                                            onClick={() => setColor(c.value)}
                                            className={cn(
                                                'w-8 h-8 rounded-full border-2 transition-all',
                                                color === c.value ? 'border-primary-500 scale-110' : 'border-gray-200'
                                            )}
                                            style={{ backgroundColor: c.value }}
                                            title={c.name}
                                        />
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'type' && (
                        <>
                            {/* Name Input */}
                            <div className="mb-4">
                                <input
                                    type="text"
                                    value={typedName}
                                    onChange={(e) => setTypedName(e.target.value)}
                                    placeholder={isInitialsMode ? "Enter your initials (e.g., JD)" : "Type your full name"}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    maxLength={isInitialsMode ? 4 : 50}
                                />
                            </div>

                            {/* Preview */}
                            <div
                                className="border border-gray-200 rounded-lg mb-4 bg-white flex items-center justify-center"
                                style={{ height: isInitialsMode ? 100 : 200 }}
                            >
                                <span
                                    style={{
                                        fontFamily: selectedFont,
                                        fontSize: isInitialsMode ? 48 : 64,
                                        color: color
                                    }}
                                >
                                    {typedName || (isInitialsMode ? 'JD' : 'Your Name')}
                                </span>
                            </div>

                            {/* Font selector */}
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-sm text-gray-600">Font:</span>
                                <div className="flex gap-2 flex-wrap">
                                    {FONTS.map((font) => (
                                        <button
                                            key={font.name}
                                            onClick={() => setSelectedFont(font.value)}
                                            className={cn(
                                                'px-3 py-1.5 text-sm rounded-md border transition-all',
                                                selectedFont === font.value
                                                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            )}
                                            style={{ fontFamily: font.value }}
                                        >
                                            {font.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Color selector */}
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600">Color:</span>
                                <div className="flex gap-2">
                                    {COLORS.map((c) => (
                                        <button
                                            key={c.value}
                                            onClick={() => setColor(c.value)}
                                            className={cn(
                                                'w-8 h-8 rounded-full border-2 transition-all',
                                                color === c.value ? 'border-primary-500 scale-110' : 'border-gray-200'
                                            )}
                                            style={{ backgroundColor: c.value }}
                                            title={c.name}
                                        />
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'upload' && (
                        <>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            {uploadedImage ? (
                                <div className="border border-gray-200 rounded-lg mb-4 bg-white p-4">
                                    <img
                                        src={uploadedImage}
                                        alt="Uploaded signature"
                                        className="max-h-48 mx-auto"
                                    />
                                    <button
                                        onClick={() => setUploadedImage(null)}
                                        className="mt-3 w-full text-sm text-red-600 hover:text-red-700"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center cursor-pointer hover:border-gray-300 transition-colors"
                                >
                                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-primary-600 hover:text-primary-700 font-medium">
                                        Click to upload image
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-gray-100">
                    <button
                        onClick={() => {
                            if (activeTab === 'draw') clearCanvas();
                            else if (activeTab === 'type') setTypedName('');
                            else if (activeTab === 'upload') setUploadedImage(null);
                        }}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        Clear
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!canSave()}
                        className="px-6 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Save {isInitialsMode ? 'Initials' : 'Signature'}
                    </button>
                </div>
            </div>

            {/* Load Google Fonts for typed signatures */}
            <link
                href="https://fonts.googleapis.com/css2?family=Caveat&family=Dancing+Script&family=Great+Vibes&family=Tangerine&display=swap"
                rel="stylesheet"
            />
        </div>
    );
}
