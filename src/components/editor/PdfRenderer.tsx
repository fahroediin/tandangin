'use client';

import { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source to CDN for the specific version we installed (3.11.174)
// This avoids bundling issues with Next.js
if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

interface PdfRendererProps {
    pdfData: ArrayBuffer | null;
    currentPage: number;
    width?: number; // Desired display width (default 612)
    onLoadSuccess?: (numPages: number) => void;
}

export default function PdfRenderer({
    pdfData,
    currentPage,
    width = 612,
    onLoadSuccess,
}: PdfRendererProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [loading, setLoading] = useState(false);
    const [pageCount, setPageCount] = useState(0);
    const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
    const [renderHeight, setRenderHeight] = useState(792); // Default logical height

    // Load PDF Document
    useEffect(() => {
        if (!pdfData) {
            setPdfDoc(null);
            setPageCount(0);
            return;
        }

        setLoading(true);

        (async () => {
            try {
                // Use the ArrayBuffer directly
                const loadingTask = pdfjsLib.getDocument(pdfData.slice(0));
                const doc = await loadingTask.promise;
                setPdfDoc(doc);
                setPageCount(doc.numPages);
                onLoadSuccess?.(doc.numPages);
            } catch (err) {
                console.error('Error loading PDF:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, [pdfData, onLoadSuccess]);

    // Render Page to Canvas
    useEffect(() => {
        if (!pdfDoc || !canvasRef.current || currentPage < 1 || currentPage > pdfDoc.numPages) return;

        let isCancelled = false;

        (async () => {
            // Fetch the page
            // Note: getPage is 1-indexed
            const page = await pdfDoc.getPage(currentPage);

            if (isCancelled) return;

            // 1. Get the viewport at scale 1 (original size)
            // e.g., for US Letter: 612 x 792
            const originalViewport = page.getViewport({ scale: 1 });

            // 2. Calculate the stored scale needed to match the requested UI width
            // If the PDF is A4 (595.28 width), and we want 612 width:
            // scale = 612 / 595.28 = 1.028
            const scale = width / originalViewport.width;

            // 3. Create a viewport with that scale
            const viewport = page.getViewport({ scale });

            // 4. Update canvas dimensions to match the scaled viewport
            const canvas = canvasRef.current!;
            const context = canvas.getContext('2d');
            if (!context) return;

            // Set visual size matches logical size
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            // Update parent container's expected height
            setRenderHeight(viewport.height);

            // 5. Render
            const renderContext = {
                canvasContext: context,
                viewport: viewport,
            };

            try {
                await page.render(renderContext).promise;
            } catch (err) {
                // Rendering might be cancelled or fail
                if (!isCancelled) {
                    console.error("Page render error:", err);
                }
            }
        })();

        return () => {
            isCancelled = true;
        };

    }, [pdfDoc, currentPage, width]);

    if (!pdfData) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">
                No PDF Document
            </div>
        );
    }

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-500">
                <svg className="w-6 h-6 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Loading PDF...
            </div>
        );
    }

    return (
        <div
            className="relative shadow-md"
            style={{ width: width, height: renderHeight }}
        >
            <canvas
                ref={canvasRef}
                className="block"
                style={{ width: width, height: renderHeight }}
            />

            {/* Page info overlay */}
            <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded pointer-events-none">
                Page {currentPage} of {pageCount}
            </div>

            {/* Dimensions Debug */}
            <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-1 rounded pointer-events-none opacity-50">
                W: {width}px H: {Math.round(renderHeight)}px
            </div>
        </div>
    );
}
