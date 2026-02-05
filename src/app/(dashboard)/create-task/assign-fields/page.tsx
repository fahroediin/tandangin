'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import FieldPalette from '@/components/editor/FieldPalette';
import DocumentViewer from '@/components/editor/DocumentViewer';
import SignatureModal from '@/components/editor/SignatureModal';

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

export default function AssignFieldsPage() {
    const router = useRouter();
    const [taskInfo, setTaskInfo] = useState<any>(null);
    const [fields, setFields] = useState<Field[]>([]);
    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
    const [selectedField, setSelectedField] = useState<Field | null>(null);
    const [showSignatureModal, setShowSignatureModal] = useState(false);

    // PDF state
    const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageCount, setPageCount] = useState(0);
    const [pdfLoading, setPdfLoading] = useState(false);

    useEffect(() => {
        const stored = sessionStorage.getItem('pendingTask');
        if (stored) {
            const parsed = JSON.parse(stored);
            setTaskInfo(parsed);

            // Load PDF file if exists
            if (parsed.fileData) {
                // Convert base64 back to ArrayBuffer
                const binaryString = atob(parsed.fileData);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                setPdfData(bytes.buffer);
            }
        }
    }, []);

    const handlePageCountChange = useCallback((numPages: number) => {
        setPageCount(numPages);
    }, []);

    const nextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, pageCount));
    };

    const prevPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const addField = (type: string) => {
        const newField: Field = {
            id: `field-${Date.now()}`,
            type,
            x: 100,
            y: 100,
            width: type === 'signature' ? 200 : 150,
            height: type === 'signature' ? 60 : 30,
            page: currentPage,
            required: true,
        };
        setFields([...fields, newField]);
    };

    const updateField = (id: string, updates: Partial<Field>) => {
        setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const deleteField = (id: string) => {
        setFields(fields.filter(f => f.id !== id));
        if (selectedField?.id === id) {
            setSelectedField(null);
        }
    };

    const handleFieldClick = (field: Field) => {
        setSelectedField(field);
        if (field.type === 'signature' && !field.value) {
            setShowSignatureModal(true);
        }
    };

    const handleSignatureComplete = (signatureData: string) => {
        if (selectedField) {
            updateField(selectedField.id, { value: signatureData });
        }
        setShowSignatureModal(false);
    };

    const handleComplete = async () => {
        if (!pdfData) {
            console.error('No PDF data available');
            alert('No PDF data available');
            return;
        }

        // Check if there are any fields with values
        const fieldsWithValues = fields.filter(f => f.value || f.type === 'date');
        console.log('All fields:', fields);
        console.log('Fields with values:', fieldsWithValues);

        if (fieldsWithValues.length === 0) {
            alert('Please add and fill at least one field before continuing.');
            return;
        }

        try {
            // Import pdfService dynamically
            const { embedSignature, addTextField, addDateField } = await import('@/lib/pdfService');

            let currentPdfBytes: Uint8Array = new Uint8Array(pdfData);
            let embeddedCount = 0;

            // Embed all fields with values
            for (const field of fields) {
                console.log('Processing field:', field.type, 'value:', field.value ? 'has value' : 'no value');

                if (!field.value && field.type !== 'date') {
                    console.log('Skipping field without value:', field.id);
                    continue;
                }

                try {
                    if (field.type === 'signature' && field.value) {
                        console.log('Embedding signature at:', { x: field.x, y: field.y, page: field.page });
                        const result = await embedSignature(currentPdfBytes, field.value, {
                            x: field.x,
                            y: field.y,
                            width: field.width,
                            height: field.height,
                            page: field.page,
                        });
                        currentPdfBytes = new Uint8Array(result);
                        embeddedCount++;
                        console.log('Signature embedded successfully');
                    } else if (field.type === 'date') {
                        console.log('Embedding date at:', { x: field.x, y: field.y, page: field.page });
                        const result = await addDateField(currentPdfBytes, new Date(), {
                            x: field.x,
                            y: field.y,
                            page: field.page,
                        });
                        currentPdfBytes = new Uint8Array(result);
                        embeddedCount++;
                        console.log('Date embedded successfully');
                    } else if (field.type === 'text' && field.value) {
                        console.log('Embedding text at:', { x: field.x, y: field.y, page: field.page });
                        const result = await addTextField(currentPdfBytes, field.value, {
                            x: field.x,
                            y: field.y,
                            page: field.page,
                        });
                        currentPdfBytes = new Uint8Array(result);
                        embeddedCount++;
                        console.log('Text embedded successfully');
                    }
                } catch (fieldError) {
                    console.error('Error embedding field:', field.id, fieldError);
                }
            }

            console.log('Total fields embedded:', embeddedCount);

            // Trigger download of signed PDF
            const blob = new Blob([currentPdfBytes.buffer.slice(0) as ArrayBuffer], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${taskInfo?.taskName || 'signed'}_signed.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Navigate to tasks page
            router.push('/tasks');
        } catch (error) {
            console.error('Error embedding signatures:', error);
            alert('Error embedding signatures: ' + (error as Error).message);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col">
            {/* Header */}
            <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <span className="font-medium flex items-center gap-2">
                        {taskInfo?.taskName || 'Assign Fields'}
                        <button className="p-1 hover:bg-slate-700 rounded transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/tasks')}
                        className="px-4 py-2 text-sm hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleComplete}
                        className="px-4 py-2 text-sm bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
                    >
                        Continue
                    </button>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex bg-gray-100">
                {/* Left Sidebar - Field Palette */}
                <FieldPalette onAddField={addField} />

                {/* Document Viewer */}
                <div className="flex-1 flex flex-col">
                    {/* Edit/Preview tabs */}
                    <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-center gap-1">
                        <button
                            onClick={() => setActiveTab('edit')}
                            className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'edit'
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => setActiveTab('preview')}
                            className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'preview'
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Preview
                        </button>
                    </div>

                    {/* Document canvas */}
                    <div className="flex-1 overflow-auto p-8">
                        <DocumentViewer
                            fields={fields.filter(f => f.page === currentPage)}
                            onFieldClick={handleFieldClick}
                            onFieldUpdate={updateField}
                            onFieldDelete={deleteField}
                            selectedFieldId={selectedField?.id}
                            isPreview={activeTab === 'preview'}
                            pdfData={pdfData}
                            currentPage={currentPage}
                            onPageCountChange={handlePageCountChange}
                        />

                        {/* Page Navigation */}
                        {pageCount > 1 && (
                            <div className="flex items-center justify-center gap-4 mt-4">
                                <button
                                    onClick={prevPage}
                                    disabled={currentPage === 1}
                                    className="px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <span className="text-sm text-gray-600">
                                    Page {currentPage} of {pageCount}
                                </span>
                                <button
                                    onClick={nextPage}
                                    disabled={currentPage === pageCount}
                                    className="px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Signature Modal */}
            {showSignatureModal && (
                <SignatureModal
                    onClose={() => setShowSignatureModal(false)}
                    onComplete={handleSignatureComplete}
                />
            )}
        </div>
    );
}
