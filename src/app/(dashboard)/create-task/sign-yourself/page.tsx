'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function SignYourselfPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [taskName, setTaskName] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            if (!taskName) {
                setTaskName(selectedFile.name.replace('.pdf', ''));
            }

            // Simulate processing
            setProcessing(true);
            setTimeout(() => {
                setProcessing(false);
            }, 1500);
        }
    };

    const handleContinue = async () => {
        if (!file || !taskName) return;

        setLoading(true);

        try {
            // Read file as ArrayBuffer and convert to base64
            const arrayBuffer = await file.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            let binary = '';
            for (let i = 0; i < bytes.length; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            const base64 = btoa(binary);

            // Store in sessionStorage
            const fileData = {
                name: file.name,
                size: file.size,
                taskName,
                type: 'self',
                fileData: base64,
            };

            sessionStorage.setItem('pendingTask', JSON.stringify(fileData));
            router.push('/create-task/assign-fields');
        } catch (error) {
            console.error('Error reading file:', error);
            setLoading(false);
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
                    <span className="font-medium">{taskName || 'New Task'}</span>
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
                        disabled={!file || !taskName || processing}
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
                            <span className="ml-1 text-gray-400" title="Name this task for easy reference">
                                <svg className="w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </span>
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
                    <div>
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

                        {/* File preview */}
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
                                            <p className="text-sm text-gray-500">
                                                {processing ? 'Processing...' : `${Math.round(file.size / 1024)} KB`}
                                            </p>
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
                </div>
            </div>
        </div>
    );
}
