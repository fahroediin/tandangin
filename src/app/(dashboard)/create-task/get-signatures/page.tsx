'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import RecipientManager from '@/components/editor/RecipientManager';

interface Recipient {
    id: string;
    name: string;
    email: string;
    role: 'signer' | 'editor';
    color: string;
    order: number;
}

const recipientColors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'
];

export default function GetSignaturesPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [taskName, setTaskName] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [setOrder, setSetOrder] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            if (!taskName) {
                setTaskName(selectedFile.name.replace('.pdf', ''));
            }

            setProcessing(true);
            setTimeout(() => {
                setProcessing(false);
            }, 1500);
        }
    };

    const addRecipient = () => {
        const newRecipient: Recipient = {
            id: `recipient-${Date.now()}`,
            name: '',
            email: '',
            role: 'signer',
            color: recipientColors[recipients.length % recipientColors.length],
            order: recipients.length + 1,
        };
        setRecipients([...recipients, newRecipient]);
    };

    const updateRecipient = (id: string, updates: Partial<Recipient>) => {
        setRecipients(recipients.map(r => r.id === id ? { ...r, ...updates } : r));
    };

    const removeRecipient = (id: string) => {
        setRecipients(recipients.filter(r => r.id !== id));
    };

    const handleContinue = () => {
        if (!file || !taskName || recipients.length === 0) return;

        const taskData = {
            name: file.name,
            taskName,
            type: 'request',
            recipients,
            setOrder,
        };

        sessionStorage.setItem('pendingTask', JSON.stringify(taskData));
        router.push('/create-task/assign-fields');
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
                    <span className="font-medium">{taskName || 'New Request'}</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/tasks')}
                        className="px-4 py-2 text-sm hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleContinue}
                        disabled={!file || !taskName || recipients.length === 0 || processing}
                        className="px-4 py-2 text-sm bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Continue
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 bg-gray-100 py-10">
                <div className="max-w-2xl mx-auto px-6">
                    {/* Task Name */}
                    <div className="mb-8">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Task Name
                        </label>
                        <input
                            type="text"
                            value={taskName}
                            onChange={(e) => setTaskName(e.target.value)}
                            className="input"
                            placeholder="Enter task name"
                        />
                    </div>

                    {/* Upload Documents */}
                    <div className="mb-8">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Upload Documents
                        </label>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="btn btn-secondary mb-4"
                        >
                            Select File
                        </button>

                        {file && (
                            <div className="card p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{file.name}</p>
                                            <p className="text-sm text-gray-500">{Math.round(file.size / 1024)} KB</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setFile(null)}
                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Manage Recipients */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <label className="block text-sm font-medium text-gray-700">
                                Manage Recipients
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-600">
                                <input
                                    type="checkbox"
                                    checked={setOrder}
                                    onChange={(e) => setSetOrder(e.target.checked)}
                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                Set Order
                            </label>
                        </div>

                        <RecipientManager
                            recipients={recipients}
                            onAdd={addRecipient}
                            onUpdate={updateRecipient}
                            onRemove={removeRecipient}
                            showOrder={setOrder}
                        />
                    </div>
                </div>
            </div>

            {/* Processing modal */}
            {processing && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                    <div className="bg-white rounded-xl p-6 shadow-xl text-center">
                        <div className="w-12 h-12 mx-auto mb-4 spinner border-4" />
                        <p className="text-gray-900 font-medium">Processing file...</p>
                        <p className="text-gray-500 text-sm">Please wait for a moment.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
