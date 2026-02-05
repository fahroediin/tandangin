'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Recipient {
    id: string;
    name: string;
    email: string;
    role: 'signer' | 'editor';
    color: string;
}

interface ReviewSendModalProps {
    taskName: string;
    recipients: Recipient[];
    onClose: () => void;
    onSend: () => void;
    onSaveDraft: () => void;
}

export default function ReviewSendModal({
    taskName,
    recipients,
    onClose,
    onSend,
    onSaveDraft,
}: ReviewSendModalProps) {
    const [identityAuth, setIdentityAuth] = useState(false);
    const [ccEmails, setCcEmails] = useState('');
    const [reference, setReference] = useState('');
    const [viewPermission, setViewPermission] = useState<'full' | 'limited'>('full');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Review & Send</h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Task Name */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Task</h3>
                        <p className="text-gray-900 font-medium">{taskName}</p>
                    </div>

                    {/* Recipients */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium text-gray-500">Recipients</h3>
                            <button className="text-sm text-primary-600 hover:text-primary-700">
                                Manage
                            </button>
                        </div>
                        <div className="space-y-2">
                            {recipients.map((recipient) => (
                                <div key={recipient.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                                        style={{ backgroundColor: recipient.color }}
                                    >
                                        {recipient.name?.charAt(0) || 'S'}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">{recipient.name || 'Signer'}</p>
                                        <p className="text-xs text-gray-500">{recipient.email}</p>
                                    </div>
                                    <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded">
                                        {recipient.role}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Identity Authentication */}
                    <div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <span className="text-sm text-gray-700">Identity Authentication</span>
                            </div>
                            <button className="text-sm text-primary-600 hover:text-primary-700">Set up</button>
                        </div>
                    </div>

                    {/* Document Viewing Permission */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-3">Document Viewing Permission</h3>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    checked={viewPermission === 'full'}
                                    onChange={() => setViewPermission('full')}
                                    className="text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm text-gray-700">Full access</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    checked={viewPermission === 'limited'}
                                    onChange={() => setViewPermission('limited')}
                                    className="text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm text-gray-700">Limited</span>
                            </label>
                        </div>
                    </div>

                    {/* CC */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">CC (Carbon Copy)</h3>
                        <input
                            type="text"
                            value={ccEmails}
                            onChange={(e) => setCcEmails(e.target.value)}
                            placeholder="Enter email addresses separated by comma"
                            className="input"
                        />
                    </div>

                    {/* References */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">References</h3>
                        <textarea
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            placeholder="Add any additional notes or references"
                            className="input min-h-[80px] resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={onSaveDraft}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        Save as Draft
                    </button>
                    <button
                        onClick={onSend}
                        className="px-6 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
