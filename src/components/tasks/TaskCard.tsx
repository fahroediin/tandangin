'use client';

import Link from 'next/link';
import { formatDateTime, getStatusColor, truncate } from '@/lib/utils';

interface TaskCardProps {
    task: {
        id: string;
        name: string;
        status: string;
        type: string;
        createdAt: string;
        thumbnail: string | null;
        recipients?: Array<{ name: string; status: string }>;
    };
}

export default function TaskCard({ task }: TaskCardProps) {
    return (
        <Link href={`/task/${task.id}`}>
            <div className="card p-0 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
                {/* Thumbnail */}
                <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden">
                    {task.thumbnail ? (
                        <img
                            src={task.thumbnail}
                            alt={task.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                    )}

                    {/* Actions menu */}
                    <button
                        className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                            e.preventDefault();
                            // Open actions menu
                        }}
                    >
                        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                    </button>
                </div>

                {/* Info */}
                <div className="p-3">
                    <h3 className="font-medium text-gray-900 text-sm mb-1 truncate">
                        {truncate(task.name, 30)}
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">
                        {formatDateTime(task.createdAt)}
                    </p>

                    {/* Status indicator */}
                    <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                            {task.status === 'pending' ? 'Pending' : task.status}
                        </span>
                    </div>

                    {/* Recipients progress */}
                    {task.recipients && task.recipients.length > 0 && (
                        <div className="mt-3 flex items-center gap-2">
                            <div className="flex-1 flex items-center">
                                {task.recipients.map((recipient, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center"
                                    >
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${recipient.status === 'signed'
                                                ? 'bg-primary-500 text-white'
                                                : 'bg-gray-200 text-gray-500'
                                            }`}>
                                            {recipient.name.charAt(0)}
                                        </div>
                                        {index < task.recipients.length - 1 && (
                                            <div className="w-6 h-0.5 bg-gray-200" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}
