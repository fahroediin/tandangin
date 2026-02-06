'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface RecipientSettings {
    identityAuth: 'none' | 'email_otp' | 'sms_otp';
    viewPermission: 'full' | 'limited';
    role: 'signer' | 'editor' | 'cc';
}

interface RecipientSettingsModalProps {
    recipientName: string;
    recipientEmail: string;
    initialSettings: RecipientSettings;
    onSave: (settings: RecipientSettings) => void;
    onClose: () => void;
}

export default function RecipientSettingsModal({
    recipientName,
    recipientEmail,
    initialSettings,
    onSave,
    onClose,
}: RecipientSettingsModalProps) {
    const [settings, setSettings] = useState<RecipientSettings>(initialSettings);

    const handleSave = () => {
        onSave(settings);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Advance Settings</h2>
                        <p className="text-sm text-gray-500">{recipientName || recipientEmail}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Role Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Role
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { value: 'signer', label: 'Signer', icon: '✍️' },
                                { value: 'editor', label: 'Editor', icon: '📝' },
                                { value: 'cc', label: 'CC', icon: '👁️' },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setSettings({ ...settings, role: option.value as any })}
                                    className={cn(
                                        'p-3 rounded-lg border-2 text-center transition-all',
                                        settings.role === option.value
                                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                                            : 'border-gray-200 hover:border-gray-300'
                                    )}
                                >
                                    <span className="text-xl block mb-1">{option.icon}</span>
                                    <span className="text-sm font-medium">{option.label}</span>
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            {settings.role === 'signer' && 'Dapat menandatangani field yang ditugaskan'}
                            {settings.role === 'editor' && 'Dapat mengisi form tanpa tanda tangan'}
                            {settings.role === 'cc' && 'Hanya menerima salinan dokumen final'}
                        </p>
                    </div>

                    {/* Identity Authentication */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Identity Authentication
                        </label>
                        <div className="space-y-2">
                            {[
                                { value: 'none', label: 'None', desc: 'Akses langsung via link' },
                                { value: 'email_otp', label: 'Email OTP', desc: 'Verifikasi kode via email' },
                                { value: 'sms_otp', label: 'SMS OTP', desc: 'Verifikasi kode via SMS' },
                            ].map((option) => (
                                <label
                                    key={option.value}
                                    className={cn(
                                        'flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all',
                                        settings.identityAuth === option.value
                                            ? 'border-primary-500 bg-primary-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    )}
                                >
                                    <input
                                        type="radio"
                                        name="identityAuth"
                                        value={option.value}
                                        checked={settings.identityAuth === option.value}
                                        onChange={() => setSettings({ ...settings, identityAuth: option.value as any })}
                                        className="sr-only"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{option.label}</p>
                                        <p className="text-xs text-gray-500">{option.desc}</p>
                                    </div>
                                    {settings.identityAuth === option.value && (
                                        <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* View Permission */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Document Access
                        </label>
                        <div className="space-y-2">
                            {[
                                { value: 'full', label: 'Full Document', desc: 'Dapat melihat seluruh dokumen' },
                                { value: 'limited', label: 'Assigned Fields Only', desc: 'Hanya melihat field yang ditugaskan' },
                            ].map((option) => (
                                <label
                                    key={option.value}
                                    className={cn(
                                        'flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all',
                                        settings.viewPermission === option.value
                                            ? 'border-primary-500 bg-primary-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    )}
                                >
                                    <input
                                        type="radio"
                                        name="viewPermission"
                                        value={option.value}
                                        checked={settings.viewPermission === option.value}
                                        onChange={() => setSettings({ ...settings, viewPermission: option.value as any })}
                                        className="sr-only"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{option.label}</p>
                                        <p className="text-xs text-gray-500">{option.desc}</p>
                                    </div>
                                    {settings.viewPermission === option.value && (
                                        <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors"
                    >
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
}
