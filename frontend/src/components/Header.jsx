import React from 'react';
import {
    SignedIn,
    SignedOut,
    SignInButton,
    SignUpButton,
    UserButton,
} from "@clerk/clerk-react";

import { MessageCircle } from 'lucide-react';

export const Header = ({ onReset, showNewAnalysis = false }) => {
    return (
        <header className="fixed top-0 left-0 right-0 h-16 border-b border-white/5 bg-[#0b0c0f]/80 backdrop-blur-md z-50 px-4 md:px-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center text-purple-500">
                    <MessageCircle size={20} className="fill-current" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-white"><span className="text-purple-500">DOC</span>-GPT</h1>
            </div>

            <div className="flex items-center gap-4">
                {showNewAnalysis && (
                    <SignedIn>
                        <button
                            onClick={onReset}
                            className="text-slate-400 hover:text-white border border-white/10 hover:bg-white/5 px-3 py-1.5 rounded-lg text-xs md:text-sm transition-all"
                        >
                            New Analysis
                        </button>
                    </SignedIn>
                )}

                <SignedOut>
                    <div className="flex items-center gap-4">
                        <SignInButton mode="modal">
                            <button className="px-5 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
                                Sign In
                            </button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                            <button className="px-5 py-2 bg-[#4f46e5] hover:bg-[#4338ca] rounded-full text-sm font-semibold text-white transition-all shadow-lg shadow-indigo-500/20">
                                Sign Up
                            </button>
                        </SignUpButton>
                    </div>
                </SignedOut>
                <SignedIn>
                    <UserButton afterSignOutUrl="/" />
                </SignedIn>
            </div>
        </header>
    );
};
