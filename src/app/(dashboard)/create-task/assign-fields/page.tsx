'use client';

import { useState, useEffect } from 'react';
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

    useEffect(() => {
        const stored = sessionStorage.getItem('pendingTask');
        if (stored) {
            setTaskInfo(JSON.parse(stored));
        }
    }, []);

    const addField = (type: string) => {
        const newField: Field = {
            id: `field-${Date.now()}`,
            type,
            x: 100,
            y: 100,
            width: type === 'signature' ? 200 : 150,
            height: type === 'signature' ? 60 : 30,
            page: 1,
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
        // In a real app, save the task with fields to the backend
        console.log('Completing task with fields:', fields);
        router.push('/tasks');
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
                            fields={fields}
                            onFieldClick={handleFieldClick}
                            onFieldUpdate={updateField}
                            onFieldDelete={deleteField}
                            selectedFieldId={selectedField?.id}
                            isPreview={activeTab === 'preview'}
                        />
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
