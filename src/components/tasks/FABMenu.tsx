'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function FABMenu() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    const handleSignYourself = () => {
        setIsOpen(false);
        router.push('/create-task/sign-yourself');
    };

    const handleGetSignatures = () => {
        setIsOpen(false);
        router.push('/create-task/get-signatures');
    };

    return (
        <div className="fixed bottom-8 right-8 z-50">
            {/* Menu options */}
            <div className={cn(
                'absolute bottom-16 right-0 transition-all duration-200',
                isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
            )}>
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden w-48">
                    <button
                        onClick={handleSignYourself}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                        <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                            <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </div>
                        Sign Yourself
                    </button>
                    <div className="border-t border-gray-100" />
                    <button
                        onClick={handleGetSignatures}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        Get Signatures
                    </button>
                </div>
            </div>

            {/* FAB button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200',
                    isOpen
                        ? 'bg-gray-700 rotate-45'
                        : 'bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700'
                )}
            >
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            </button>
        </div>
    );
}
