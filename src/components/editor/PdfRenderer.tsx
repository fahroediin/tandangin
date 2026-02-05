'use client';

import { useState, useEffect } from 'react';

interface PdfRendererProps {
    pdfData: ArrayBuffer | null;
    currentPage: number;
    width?: number;
    onLoadSuccess?: (numPages: number) => void;
}

export default function PdfRenderer({
    pdfData,
    currentPage,
    width = 612,
    onLoadSuccess,
}: PdfRendererProps) {
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [pageCount, setPageCount] = useState(0);

    useEffect(() => {
        if (!pdfData) {
            setPdfUrl(null);
            return;
        }

        setLoading(true);

        // Create blob URL from ArrayBuffer
        const blob = new Blob([pdfData], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);

        // Get page count using pdf-lib
        (async () => {
            try {
                const { PDFDocument } = await import('pdf-lib');
                const pdfDoc = await PDFDocument.load(pdfData);
                const count = pdfDoc.getPageCount();
                setPageCount(count);
                onLoadSuccess?.(count);
            } catch (err) {
                console.error('Error loading PDF:', err);
            } finally {
                setLoading(false);
            }
        })();

        // Cleanup URL on unmount
        return () => {
            if (url) {
                URL.revokeObjectURL(url);
            }
        };
    }, [pdfData, onLoadSuccess]);

    if (!pdfData) {
        return (
            <div className="w-full flex items-center justify-center text-gray-400 bg-gray-50" style={{ height: 792 }}>
                <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm">No document loaded</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="w-full flex items-center justify-center bg-gray-50" style={{ height: 792 }}>
                <div className="flex items-center gap-2 text-gray-500">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-sm">Loading PDF...</span>
                </div>
            </div>
        );
    }

    if (!pdfUrl) {
        return null;
    }

    // Use embed/object for PDF preview
    return (
        <div className="relative" style={{ width, height: 792 }}>
            <object
                data={`${pdfUrl}#page=${currentPage}&toolbar=0&navpanes=0&scrollbar=0`}
                type="application/pdf"
                width="100%"
                height="100%"
                className="rounded-lg"
            >
                <embed
                    src={`${pdfUrl}#page=${currentPage}&toolbar=0&navpanes=0&scrollbar=0`}
                    type="application/pdf"
                    width="100%"
                    height="100%"
                />
            </object>
            {/* Page indicator overlay */}
            {pageCount > 0 && (
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    Page {currentPage} of {pageCount}
                </div>
            )}
        </div>
    );
}
