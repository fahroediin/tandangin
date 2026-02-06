'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import RecipientSettingsModal from './RecipientSettingsModal';

export interface RecipientSettings {
    identityAuth: 'none' | 'email_otp' | 'sms_otp';
    viewPermission: 'full' | 'limited';
}

export interface Recipient {
    id: string;
    name: string;
    email: string;
    role: 'signer' | 'editor' | 'cc';
    color: string;
    order: number;
    settings?: RecipientSettings;
}

interface RecipientManagerProps {
    recipients: Recipient[];
    onAdd: () => void;
    onUpdate: (id: string, updates: Partial<Recipient>) => void;
    onRemove: (id: string) => void;
    showOrder?: boolean;
}

const defaultSettings: RecipientSettings = {
    identityAuth: 'none',
    viewPermission: 'full',
};

export default function RecipientManager({
    recipients,
    onAdd,
    onUpdate,
    onRemove,
    showOrder = false,
}: RecipientManagerProps) {
    const [settingsModalRecipient, setSettingsModalRecipient] = useState<Recipient | null>(null);

    const handleSaveSettings = (settings: RecipientSettings & { role: 'signer' | 'editor' | 'cc' }) => {
        if (!settingsModalRecipient) return;
        onUpdate(settingsModalRecipient.id, {
            role: settings.role,
            settings: {
                identityAuth: settings.identityAuth,
                viewPermission: settings.viewPermission,
            },
        });
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'signer': return '✍️';
            case 'editor': return '📝';
            case 'cc': return '👁️';
            default: return '✍️';
        }
    };

    return (
        <>
            <div className="space-y-4">
                {recipients.map((recipient, index) => (
                    <div key={recipient.id} className="card p-4">
                        <div className="flex items-start gap-4">
                            {/* Order number */}
                            {showOrder && (
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
                                    style={{ backgroundColor: recipient.color }}
                                >
                                    {index + 1}
                                </div>
                            )}

                            {/* Color indicator (when not showing order) */}
                            {!showOrder && (
                                <div
                                    className="w-3 h-full rounded-full flex-shrink-0 min-h-[60px]"
                                    style={{ backgroundColor: recipient.color }}
                                />
                            )}

                            {/* Form fields */}
                            <div className="flex-1 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        value={recipient.name}
                                        onChange={(e) => onUpdate(recipient.id, { name: e.target.value })}
                                        placeholder="Name"
                                        className="input"
                                    />
                                    <input
                                        type="email"
                                        value={recipient.email}
                                        onChange={(e) => onUpdate(recipient.id, { email: e.target.value })}
                                        placeholder="Email"
                                        className="input"
                                    />
                                </div>

                                {/* Role badge and Advanced Settings link */}
                                <div className="flex items-center gap-3">
                                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                                        {getRoleIcon(recipient.role)} {recipient.role}
                                    </span>
                                    {recipient.settings?.identityAuth && recipient.settings.identityAuth !== 'none' && (
                                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 rounded-full text-blue-600">
                                            🔐 {recipient.settings.identityAuth === 'email_otp' ? 'Email OTP' : 'SMS OTP'}
                                        </span>
                                    )}
                                    <button
                                        className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 ml-auto"
                                        onClick={() => setSettingsModalRecipient(recipient)}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                        </svg>
                                        Advance Settings
                                    </button>
                                </div>
                            </div>

                            {/* Remove button */}
                            <button
                                onClick={() => onRemove(recipient.id)}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}

                {/* Add Signer button */}
                <button
                    onClick={onAdd}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Signer
                </button>
            </div>

            {/* Settings Modal */}
            {settingsModalRecipient && (
                <RecipientSettingsModal
                    recipientName={settingsModalRecipient.name}
                    recipientEmail={settingsModalRecipient.email}
                    initialSettings={{
                        identityAuth: settingsModalRecipient.settings?.identityAuth || defaultSettings.identityAuth,
                        viewPermission: settingsModalRecipient.settings?.viewPermission || defaultSettings.viewPermission,
                        role: settingsModalRecipient.role,
                    }}
                    onSave={handleSaveSettings}
                    onClose={() => setSettingsModalRecipient(null)}
                />
            )}
        </>
    );
}
