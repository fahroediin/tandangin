'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Task {
    id: string;
    name: string;
    status: string;
    type: string;
    createdAt: string;
    documents: {
        id: string;
        originalName: string;
        signedPath: string;
        pageCount: number;
    }[];
    auditLogs: {
        id: string;
        action: string;
        details: string | null;
        createdAt: string;
        user: {
            name: string | null;
            email: string;
        } | null;
    }[];
}

export default function TaskPreviewPage() {
    const params = useParams();
    const router = useRouter();
    const taskId = params.taskId as string;

    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAuditTrail, setShowAuditTrail] = useState(false);

    useEffect(() => {
        async function fetchTask() {
            try {
                const response = await fetch(`/api/tasks/${taskId}`);
                if (!response.ok) {
                    throw new Error('Task not found');
                }
                const data = await response.json();
                setTask(data.task);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        }

        if (taskId) {
            fetchTask();
        }
    }, [taskId]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatAction = (action: string) => {
        const actionLabels: Record<string, string> = {
            task_created: 'Task Created',
            task_signed: 'Signed',
            task_completed: 'Completed',
            task_viewed: 'Viewed',
            document_uploaded: 'Document Uploaded',
        };
        return actionLabels[action] || action;
    };

    const handleDownload = async () => {
        if (!task?.documents[0]) return;

        window.open(`/api/documents/${task.documents[0].id}/download`, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex items-center gap-2 text-gray-500">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Loading...</span>
                </div>
            </div>
        );
    }

    if (error || !task) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 mb-4">{error || 'Task not found'}</p>
                    <button
                        onClick={() => router.push('/tasks')}
                        className="text-primary-500 hover:underline"
                    >
                        Back to Tasks
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/tasks')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <span className="font-medium text-gray-900">{task.name}</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowAuditTrail(true)}
                        className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
                    >
                        Audit Trail
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center p-8">
                {task.documents[0] ? (
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ width: 700, height: 900 }}>
                        <object
                            data={`/api/documents/${task.documents[0].id}/download`}
                            type="application/pdf"
                            width="100%"
                            height="100%"
                        >
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <p className="text-gray-500 mb-4">Unable to display PDF</p>
                                    <button
                                        onClick={handleDownload}
                                        className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                                    >
                                        Download PDF
                                    </button>
                                </div>
                            </div>
                        </object>
                    </div>
                ) : (
                    <div className="text-center text-gray-500">
                        No document available
                    </div>
                )}
            </div>

            {/* Audit Trail Modal */}
            {showAuditTrail && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">Audit Trail</h3>
                            <button
                                onClick={() => setShowAuditTrail(false)}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            <div className="space-y-4">
                                {task.auditLogs?.map((log, index) => (
                                    <div key={log.id} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-3 h-3 rounded-full bg-primary-500" />
                                            {index < task.auditLogs.length - 1 && (
                                                <div className="w-0.5 h-full bg-gray-200 mt-1" />
                                            )}
                                        </div>
                                        <div className="flex-1 pb-4">
                                            <p className="font-medium text-gray-900">
                                                {formatAction(log.action)}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {log.user?.name || log.user?.email || 'System'}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {formatDate(log.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                )) || (
                                        <p className="text-center text-gray-500">No audit logs available</p>
                                    )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
