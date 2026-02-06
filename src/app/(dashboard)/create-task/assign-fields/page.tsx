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
    recipientId?: string;
    recipientColor?: string;
}

interface Recipient {
    id: string;
    name: string;
    email: string;
    color: string;
    role: string;
    order: number;
}

export default function AssignFieldsPage() {
    const router = useRouter();
    const [taskInfo, setTaskInfo] = useState<any>(null);
    const [fields, setFields] = useState<Field[]>([]);
    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
    const [selectedField, setSelectedField] = useState<Field | null>(null);
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [showShortcutsModal, setShowShortcutsModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // PDF state
    const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageCount, setPageCount] = useState(0);
    const [pdfLoading, setPdfLoading] = useState(false);

    // Clipboard and History for undo/redo
    const [clipboard, setClipboard] = useState<Field | null>(null);
    const [history, setHistory] = useState<Field[][]>([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);

    // Recipients state (from pendingTask for request e-sign flow)
    const recipients: Recipient[] = taskInfo?.recipients || [];
    const isRequestFlow = taskInfo?.type === 'request' && recipients.length > 0;

    // Save to history when fields change
    const saveToHistory = useCallback((newFields: Field[]) => {
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(newFields);
            // Limit history to 50 items
            if (newHistory.length > 50) newHistory.shift();
            return newHistory;
        });
        setHistoryIndex(prev => Math.min(prev + 1, 49));
    }, [historyIndex]);

    // Undo
    const undo = useCallback(() => {
        if (historyIndex > 0) {
            setHistoryIndex(prev => prev - 1);
            setFields(history[historyIndex - 1]);
            setSelectedField(null);
        }
    }, [history, historyIndex]);

    // Redo
    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(prev => prev + 1);
            setFields(history[historyIndex + 1]);
            setSelectedField(null);
        }
    }, [history, historyIndex]);

    // Copy field
    const copyField = useCallback(() => {
        if (selectedField) {
            setClipboard({ ...selectedField });
        }
    }, [selectedField]);

    // Paste field
    const pasteField = useCallback(() => {
        if (clipboard) {
            const newField: Field = {
                ...clipboard,
                id: `field-${Date.now()}`,
                x: clipboard.x + 20,
                y: clipboard.y + 20,
                page: currentPage,
            };
            const newFields = [...fields, newField];
            setFields(newFields);
            saveToHistory(newFields);
            setSelectedField(newField);
        }
    }, [clipboard, currentPage, fields, saveToHistory]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger shortcuts when typing in input fields
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            // Delete / Backspace - Delete selected field
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedField) {
                e.preventDefault();
                const newFields = fields.filter(f => f.id !== selectedField.id);
                setFields(newFields);
                saveToHistory(newFields);
                setSelectedField(null);
            }

            // Ctrl/Cmd + C - Copy
            if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedField) {
                e.preventDefault();
                copyField();
            }

            // Ctrl/Cmd + V - Paste
            if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboard) {
                e.preventDefault();
                pasteField();
            }

            // Ctrl/Cmd + Z - Undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undo();
            }

            // Ctrl/Cmd + Shift + Z - Redo
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
                e.preventDefault();
                redo();
            }

            // ? - Show shortcuts modal
            if (e.key === '?') {
                e.preventDefault();
                setShowShortcutsModal(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedField, fields, clipboard, copyField, pasteField, undo, redo, saveToHistory]);

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

    // Selected recipient for field assignment
    const [selectedRecipient, setSelectedRecipient] = useState<string>('');

    // Set default recipient when taskInfo loads
    useEffect(() => {
        if (recipients.length > 0 && !selectedRecipient) {
            setSelectedRecipient(recipients[0].id);
        }
    }, [recipients, selectedRecipient]);

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
        // Set appropriate default sizes for each field type
        const fieldSizes: Record<string, { width: number; height: number }> = {
            signature: { width: 200, height: 60 },
            date: { width: 150, height: 35 },
            text: { width: 200, height: 35 },
            checkbox: { width: 120, height: 30 },
            radio: { width: 120, height: 30 },
            image: { width: 150, height: 100 },
            hyperlink: { width: 200, height: 35 },
        };
        const size = fieldSizes[type] || { width: 150, height: 30 };

        // Get recipient info for request flow
        const recipient = recipients.find(r => r.id === selectedRecipient);

        const newField: Field = {
            id: `field-${Date.now()}`,
            type,
            x: 100,
            y: 100,
            width: size.width,
            height: size.height,
            page: currentPage,
            required: type !== 'checkbox' && type !== 'radio', // checkbox/radio not required by default
            value: type === 'date' ? new Date().toISOString().split('T')[0] : undefined, // Default today's date
            recipientId: isRequestFlow ? selectedRecipient : undefined,
            recipientColor: isRequestFlow ? recipient?.color : undefined,
        };
        const newFields = [...fields, newField];
        setFields(newFields);
        saveToHistory(newFields);
    };

    const updateField = (id: string, updates: Partial<Field>) => {
        const newFields = fields.map(f => f.id === id ? { ...f, ...updates } : f);
        setFields(newFields);
        // Don't save position updates to history (too frequent)
        if (!('x' in updates) && !('y' in updates)) {
            saveToHistory(newFields);
        }
    };

    const deleteField = (id: string) => {
        const newFields = fields.filter(f => f.id !== id);
        setFields(newFields);
        saveToHistory(newFields);
        if (selectedField?.id === id) {
            setSelectedField(null);
        }
    };

    const handleFieldClick = (field: Field) => {
        setSelectedField(field);
        // Only open signature modal for self-sign flow (not request flow)
        if (!isRequestFlow && field.type === 'signature' && !field.value) {
            setShowSignatureModal(true);
        }
    };

    const handleSignatureComplete = (signatureData: string) => {
        if (selectedField) {
            updateField(selectedField.id, { value: signatureData });
        }
        setShowSignatureModal(false);
    };

    // Show confirmation modal
    const handleComplete = () => {
        if (!pdfData) {
            console.error('No PDF data available');
            alert('No PDF data available');
            return;
        }

        // For Request E-Sign: just check if there are any fields placed
        if (isRequestFlow) {
            if (fields.length === 0) {
                alert('Please add at least one field for recipients to fill.');
                return;
            }
            // Check if all fields have a recipient assigned
            const unassignedFields = fields.filter(f => !f.recipientId);
            if (unassignedFields.length > 0) {
                alert('Please ensure all fields are assigned to a recipient.');
                return;
            }
            setShowConfirmModal(true);
            return;
        }

        // For self-sign: check if there are any fields with values
        const fieldsWithValues = fields.filter(f => f.value || f.type === 'date');

        if (fieldsWithValues.length === 0) {
            alert('Please add and fill at least one field before continuing.');
            return;
        }

        // Show confirmation modal
        setShowConfirmModal(true);
    };

    // Execute the actual embedding and download
    const executeComplete = async () => {
        setShowConfirmModal(false);

        if (!pdfData) return;

        // For Request E-Sign flow: save task and fields to database, then navigate to send
        if (isRequestFlow) {
            try {
                // Convert PDF to base64
                const pdfBase64 = btoa(
                    Array.from(new Uint8Array(pdfData)).map(b => String.fromCharCode(b)).join('')
                );

                const response = await fetch('/api/tasks/create-request', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        taskName: taskInfo?.taskName || 'Untitled',
                        originalFileName: taskInfo?.fileName || 'document.pdf',
                        pdfBase64,
                        pageCount,
                        recipients: recipients.map(r => ({
                            id: r.id, // Send temp ID for mapping fields
                            name: r.name,
                            email: r.email,
                            role: r.role,
                            order: r.order,
                            color: r.color,
                        })),
                        fields: fields.map(f => ({
                            type: f.type,
                            page: f.page,
                            x: f.x,
                            y: f.y,
                            width: f.width,
                            height: f.height,
                            required: f.required,
                            recipientId: f.recipientId,
                        })),
                        setOrder: taskInfo?.setOrder || false,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    // Prioritize detailed message if available, otherwise general error
                    const errorMessage = errorData.details || errorData.error || 'Failed to create request task';
                    throw new Error(errorMessage);
                }

                const result = await response.json();
                console.log('Request task created:', result);

                // Clear session storage
                sessionStorage.removeItem('pendingTask');

                // Navigate to task detail page where they can send
                router.push(`/task/${result.taskId}`);
            } catch (error) {
                console.error('Error creating request task:', error);
                alert('Error creating request: ' + (error as Error).message);
            }
            return;
        }

        // Self-sign flow: embed all fields with values
        try {
            // Import pdfService dynamically
            const { embedSignature, addTextField, addDateField, addCheckboxField, addImageField } = await import('@/lib/pdfService');

            let currentPdfBytes: Uint8Array = new Uint8Array(pdfData);
            let embeddedCount = 0;

            // Embed all fields with values
            for (const field of fields) {
                console.log('Processing field:', field.type, 'value:', field.value ? 'has value' : 'no value');

                // Skip fields without values (except date which always has a value, and checkbox which can be unchecked)
                if (!field.value && field.type !== 'date' && field.type !== 'checkbox') {
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
                        const dateValue = field.value || new Date().toISOString().split('T')[0];
                        const result = await addDateField(currentPdfBytes, dateValue, {
                            x: field.x,
                            y: field.y,
                            width: field.width,
                            height: field.height,
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
                            width: field.width,
                            height: field.height,
                            page: field.page,
                        });
                        currentPdfBytes = new Uint8Array(result);
                        embeddedCount++;
                        console.log('Text embedded successfully');
                    } else if (field.type === 'checkbox') {
                        console.log('Embedding checkbox at:', { x: field.x, y: field.y, page: field.page, checked: field.value === 'true' });
                        const result = await addCheckboxField(currentPdfBytes, field.value === 'true', {
                            x: field.x,
                            y: field.y,
                            width: field.width,
                            height: field.height,
                            page: field.page,
                        });
                        currentPdfBytes = new Uint8Array(result);
                        embeddedCount++;
                        console.log('Checkbox embedded successfully');
                    } else if (field.type === 'image' && field.value) {
                        console.log('Embedding image at:', { x: field.x, y: field.y, page: field.page });
                        const result = await addImageField(currentPdfBytes, field.value, {
                            x: field.x,
                            y: field.y,
                            width: field.width,
                            height: field.height,
                            page: field.page,
                        });
                        currentPdfBytes = new Uint8Array(result);
                        embeddedCount++;
                        console.log('Image embedded successfully');
                    } else if (field.type === 'hyperlink' && field.value) {
                        // Hyperlink rendered as text
                        console.log('Embedding hyperlink at:', { x: field.x, y: field.y, page: field.page });
                        const result = await addTextField(currentPdfBytes, field.value, {
                            x: field.x,
                            y: field.y,
                            width: field.width,
                            height: field.height,
                            page: field.page,
                        });
                        currentPdfBytes = new Uint8Array(result);
                        embeddedCount++;
                        console.log('Hyperlink embedded successfully');
                    }
                } catch (fieldError) {
                    console.error('Error embedding field:', field.id, fieldError);
                }
            }

            console.log('Total fields embedded:', embeddedCount);

            // Convert signed PDF to base64
            const signedPdfBase64 = btoa(
                Array.from(currentPdfBytes).map(b => String.fromCharCode(b)).join('')
            );

            // Save to database via API
            const response = await fetch('/api/tasks/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taskName: taskInfo?.taskName || 'Untitled',
                    signedPdfBase64,
                    originalFileName: taskInfo?.fileName || 'document.pdf',
                    pageCount,
                    fields: fields.map(f => ({
                        type: f.type,
                        page: f.page,
                        x: f.x,
                        y: f.y,
                        width: f.width,
                        height: f.height,
                        required: f.required,
                        value: f.value,
                    })),
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save task');
            }

            const result = await response.json();
            console.log('Task saved:', result);

            // Navigate to task preview page
            router.push(`/task/${result.taskId}`);
        } catch (error) {
            console.error('Error completing task:', error);
            alert('Error completing task: ' + (error as Error).message);
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
                <FieldPalette
                    onAddField={addField}
                    recipients={isRequestFlow ? recipients.map(r => ({ id: r.id, name: r.name, email: r.email, color: r.color })) : []}
                    selectedRecipient={selectedRecipient}
                    onSelectRecipient={setSelectedRecipient}
                />

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

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">Sign Yourself</h3>
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-600 text-center">Confirm file create</p>
                        </div>
                        <div className="flex items-center justify-end gap-3 p-4 bg-gray-50">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeComplete}
                                className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Keyboard Shortcuts Modal */}
            {showShortcutsModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">Keyboard Shortcuts</h3>
                            <button
                                onClick={() => setShowShortcutsModal(false)}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">🗑️</span>
                                    <span className="text-gray-600">Delete Field</span>
                                </div>
                                <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">Backspace</kbd>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">📋</span>
                                    <span className="text-gray-600">Copy Field</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">Ctrl</kbd>
                                    <span className="text-gray-400">+</span>
                                    <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">C</kbd>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">📄</span>
                                    <span className="text-gray-600">Paste Copied Field</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">Ctrl</kbd>
                                    <span className="text-gray-400">+</span>
                                    <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">V</kbd>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">↩️</span>
                                    <span className="text-gray-600">Undo</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">Ctrl</kbd>
                                    <span className="text-gray-400">+</span>
                                    <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">Z</kbd>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">↪️</span>
                                    <span className="text-gray-600">Redo</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">Ctrl</kbd>
                                    <span className="text-gray-400">+</span>
                                    <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">Shift</kbd>
                                    <span className="text-gray-400">+</span>
                                    <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">Z</kbd>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-100">
                            <label className="flex items-center gap-2 text-sm text-gray-500">
                                <input type="checkbox" className="rounded border-gray-300" />
                                <span>Got it. Do not show it again.</span>
                            </label>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
