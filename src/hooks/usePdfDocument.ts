import { useState, useEffect, useCallback } from 'react';

interface UsePdfDocumentOptions {
    url?: string;
    file?: File;
}

interface UsePdfDocumentReturn {
    pageCount: number;
    currentPage: number;
    loading: boolean;
    error: string | null;
    pdfData: ArrayBuffer | null;
    setCurrentPage: (page: number) => void;
    nextPage: () => void;
    prevPage: () => void;
}

export function usePdfDocument({ url, file }: UsePdfDocumentOptions): UsePdfDocumentReturn {
    const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
    const [pageCount, setPageCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadPdf = async () => {
            setLoading(true);
            setError(null);

            try {
                let arrayBuffer: ArrayBuffer;

                if (file) {
                    arrayBuffer = await file.arrayBuffer();
                } else if (url) {
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error('Failed to fetch PDF');
                    }
                    arrayBuffer = await response.arrayBuffer();
                } else {
                    setLoading(false);
                    return;
                }

                setPdfData(arrayBuffer);

                // Get page count using pdf-lib
                const { PDFDocument } = await import('pdf-lib');
                const pdfDoc = await PDFDocument.load(arrayBuffer);
                setPageCount(pdfDoc.getPageCount());
                setCurrentPage(1);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load PDF');
            } finally {
                setLoading(false);
            }
        };

        loadPdf();
    }, [url, file]);

    const nextPage = useCallback(() => {
        setCurrentPage((prev) => Math.min(prev + 1, pageCount));
    }, [pageCount]);

    const prevPage = useCallback(() => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    }, []);

    return {
        pageCount,
        currentPage,
        loading,
        error,
        pdfData,
        setCurrentPage,
        nextPage,
        prevPage,
    };
}
