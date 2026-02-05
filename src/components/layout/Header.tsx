'use client';

import { getInitials } from '@/lib/utils';

interface HeaderProps {
    user: {
        name?: string | null;
        email: string;
        image?: string | null;
    };
}

export default function Header({ user }: HeaderProps) {
    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
            <div>
                {/* Breadcrumb or page title can go here */}
            </div>

            <div className="flex items-center gap-4">
                {/* Help button */}
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>

                {/* User avatar */}
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-medium">
                        {user.image ? (
                            <img src={user.image} alt={user.name || 'User'} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            getInitials(user.name || user.email)
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
