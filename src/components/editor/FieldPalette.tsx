'use client';

import { cn } from '@/lib/utils';

interface FieldPaletteProps {
    onAddField: (type: string) => void;
    recipients?: Array<{ id: string; name: string; color: string }>;
    selectedRecipient?: string;
    onSelectRecipient?: (id: string) => void;
}

const fieldTypes = [
    { type: 'signature', label: 'Signature', icon: SignatureIcon, premium: false },
    { type: 'date', label: 'Date', icon: DateIcon, premium: false },
    { type: 'text', label: 'Text', icon: TextIcon, premium: false },
    { type: 'checkbox', label: 'Checkbox', icon: CheckboxIcon, premium: true },
    { type: 'radio', label: 'Radio Button', icon: RadioIcon, premium: true },
    { type: 'image', label: 'Image', icon: ImageIcon, premium: true },
    { type: 'hyperlink', label: 'Hyperlink', icon: HyperlinkIcon, premium: true },
];

export default function FieldPalette({
    onAddField,
    recipients = [],
    selectedRecipient,
    onSelectRecipient
}: FieldPaletteProps) {
    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
            {/* Upload Documents section */}
            <div className="p-4 border-b border-gray-100">
                <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary-600 transition-colors w-full">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    <span className="font-medium">Upload Documents</span>
                    <span className="ml-auto text-primary-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                    </span>
                </button>
            </div>

            {/* Recipient section (for request signatures) */}
            {recipients.length > 0 && (
                <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary-600 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            <span className="font-medium">Recipient</span>
                        </button>
                        <button className="text-sm text-primary-500 hover:text-primary-600">Edit</button>
                    </div>
                </div>
            )}

            {/* Create Fields section */}
            <div className="p-4 flex-1">
                <button className="flex items-center gap-2 text-sm text-gray-700 mb-4 w-full">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    <span className="font-medium">Create Fields</span>
                </button>

                {/* Recipient selector (if available) */}
                {recipients.length > 0 && (
                    <div className="mb-4">
                        <select
                            value={selectedRecipient}
                            onChange={(e) => onSelectRecipient?.(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        >
                            {recipients.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Field type buttons */}
                <div className="space-y-1">
                    {fieldTypes.map((field) => (
                        <button
                            key={field.type}
                            onClick={() => onAddField(field.type)}
                            className={cn(
                                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors',
                                'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                            )}
                        >
                            <field.icon className="w-5 h-5 text-gray-400" />
                            <span>{field.label}</span>
                            {field.premium && (
                                <svg className="w-4 h-4 text-amber-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </aside>
    );
}

function SignatureIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
    );
}

function DateIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    );
}

function TextIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
    );
}

function CheckboxIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function RadioIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="9" strokeWidth={2} />
            <circle cx="12" cy="12" r="4" fill="currentColor" />
        </svg>
    );
}

function ImageIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    );
}

function HyperlinkIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
    );
}
