'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import TaskCard from '@/components/tasks/TaskCard';
import FABMenu from '@/components/tasks/FABMenu';

const tabs = [
    { id: 'waiting-me', label: 'Waiting for Me', count: 0 },
    { id: 'waiting-others', label: 'Waiting for Others', count: 0 },
    { id: 'completed', label: 'Completed', count: 0 },
    { id: 'canceled', label: 'Canceled', count: 0 },
    { id: 'drafts', label: 'Drafts', count: 0 },
];

const secondaryTabs = [
    { id: 'archive', label: 'Archive', icon: ArchiveIcon },
    { id: 'trash', label: 'Trash', icon: TrashIcon },
];

// Mock data for demonstration
const mockTasks = [
    {
        id: '1',
        name: 'Sample Contract Agreement',
        status: 'pending',
        type: 'request',
        createdAt: new Date().toISOString(),
        thumbnail: null,
        recipients: [
            { name: 'John Doe', status: 'pending' },
            { name: 'Jane Smith', status: 'signed' },
        ],
    },
];

export default function TasksPage() {
    const [activeTab, setActiveTab] = useState('waiting-me');
    const [tasks] = useState(mockTasks);

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
                                <span>{tab.count}</span>
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
                    <select className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20">
                        <option>All</option>
                        <option>Recent</option>
                        <option>Oldest</option>
                    </select>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <GridIcon className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <RefreshIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Task Grid */}
            {tasks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {tasks.map((task) => (
                        <TaskCard key={task.id} task={task} />
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

function GridIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
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
