'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import FABMenu from '@/components/tasks/FABMenu';

interface Task {
    id: string;
    name: string;
    status: string;
    type: string;
    createdAt: string;
    documents: {
        id: string;
        originalName: string;
    }[];
    recipients: {
        name: string;
        email: string;
        status: string;
    }[];
    creator: {
        name: string | null;
        email: string;
    };
}

interface TabConfig {
    id: string;
    label: string;
    statusFilter?: string;
}

const tabs: TabConfig[] = [
    { id: 'waiting-me', label: 'Waiting for Me' },
    { id: 'waiting-others', label: 'Waiting for Others' },
    { id: 'completed', label: 'Completed', statusFilter: 'completed' },
    { id: 'canceled', label: 'Canceled', statusFilter: 'cancelled' },
    { id: 'drafts', label: 'Drafts', statusFilter: 'draft' },
];

const secondaryTabs = [
    { id: 'archive', label: 'Archive', icon: ArchiveIcon },
    { id: 'trash', label: 'Trash', icon: TrashIcon },
];

export default function TasksPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('completed');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const handleDeleteTask = async (taskId: string) => {
        setDeleting(true);
        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete task');
            setDeleteConfirmId(null);
            setOpenMenuId(null);
            fetchTasks(); // Refresh the list
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('Gagal menghapus task');
        } finally {
            setDeleting(false);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            if (openMenuId) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [openMenuId]);

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/tasks');
            if (!response.ok) throw new Error('Failed to fetch tasks');
            const data = await response.json();

            const allTasks = data.tasks || [];
            setTasks(allTasks);

            // Calculate tab counts
            const counts: Record<string, number> = {
                'waiting-me': 0,
                'waiting-others': 0,
                'completed': allTasks.filter((t: Task) => t.status === 'completed').length,
                'canceled': allTasks.filter((t: Task) => t.status === 'cancelled').length,
                'drafts': allTasks.filter((t: Task) => t.status === 'draft').length,
                'archive': 0,
                'trash': allTasks.filter((t: Task) => t.status === 'deleted').length,
            };
            setTabCounts(counts);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // Filter tasks based on active tab
    const filteredTasks = tasks.filter(task => {
        const tab = tabs.find(t => t.id === activeTab) || secondaryTabs.find(t => t.id === activeTab);
        if (tab && 'statusFilter' in tab && tab.statusFilter) {
            return task.status === tab.statusFilter;
        }
        if (activeTab === 'trash') {
            return task.status === 'deleted';
        }
        return false;
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* Tabs */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-1 border-b border-gray-200">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'px-4 py-3 text-sm font-medium transition-colors relative',
                                activeTab === tab.id
                                    ? 'text-primary-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            )}
                        >
                            <span className="flex items-center gap-2">
                                <span>{tabCounts[tab.id] || 0}</span>
                                <span>{tab.label}</span>
                            </span>
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
                            )}
                        </button>
                    ))}

                    <div className="w-px h-6 bg-gray-200 mx-2" />

                    {secondaryTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'p-3 text-sm transition-colors',
                                activeTab === tab.id
                                    ? 'text-primary-600'
                                    : 'text-gray-400 hover:text-gray-600'
                            )}
                            title={tab.label}
                        >
                            <tab.icon className="w-5 h-5" />
                        </button>
                    ))}
                </div>

                {/* View options */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchTasks()}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <RefreshIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Task Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="flex items-center gap-2 text-gray-500">
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>Loading...</span>
                    </div>
                </div>
            ) : filteredTasks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredTasks.map((task) => (
                        <div
                            key={task.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => router.push(`/task/${task.id}`)}
                        >
                            {/* Thumbnail placeholder */}
                            <div className="aspect-[4/3] bg-gray-100 relative">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                {/* Three dot menu */}
                                <div className="absolute top-2 right-2">
                                    <button
                                        className="p-2 bg-white/80 hover:bg-white rounded-full transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenMenuId(openMenuId === task.id ? null : task.id);
                                        }}
                                    >
                                        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                                        </svg>
                                    </button>

                                    {/* Dropdown Menu */}
                                    {openMenuId === task.id && (
                                        <div
                                            className="absolute top-full right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/task/${task.id}`);
                                                }}
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                Lihat
                                            </button>
                                            <button
                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // TODO: Archive functionality
                                                    setOpenMenuId(null);
                                                }}
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                                </svg>
                                                Arsipkan
                                            </button>
                                            <hr className="my-1 border-gray-100" />
                                            <button
                                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteConfirmId(task.id);
                                                    setOpenMenuId(null);
                                                }}
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Hapus
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Card content */}
                            <div className="p-4">
                                <h3 className="font-medium text-gray-900 truncate mb-1">{task.name}</h3>
                                <p className="text-xs text-gray-500">{formatDate(task.createdAt)}</p>

                                {/* Status indicator */}
                                <div className="mt-4 flex items-center gap-2">
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <span className="text-sm">👤</span>
                                        <span>Me</span>
                                    </div>
                                    <div className="flex-1 h-0.5 bg-gray-200 rounded">
                                        <div
                                            className={cn(
                                                "h-full rounded transition-all",
                                                task.status === 'completed' ? 'bg-green-500 w-full' : 'bg-yellow-500 w-1/2'
                                            )}
                                        />
                                    </div>
                                    <div className="flex items-center gap-1 text-xs">
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-xs font-medium",
                                            task.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        )}>
                                            {task.status === 'completed' ? 'Signed' : 'Pending'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
                    <p className="text-gray-500 mb-6">Get started by creating your first signing task</p>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Hapus Task?</h3>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Task ini akan dipindahkan ke Trash. Anda masih bisa memulihkannya nanti.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                onClick={() => setDeleteConfirmId(null)}
                                disabled={deleting}
                            >
                                Batal
                            </button>
                            <button
                                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                                onClick={() => handleDeleteTask(deleteConfirmId)}
                                disabled={deleting}
                            >
                                {deleting ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Menghapus...
                                    </>
                                ) : (
                                    'Hapus'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FAB Menu */}
            <FABMenu />
        </div>
    );
}

function ArchiveIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
    );
}

function TrashIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    );
}

function RefreshIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
    );
}
