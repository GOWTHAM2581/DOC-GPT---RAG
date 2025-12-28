import React from 'react';
import { NavLink } from 'react-router-dom';
import { MessageSquare, FileText, Settings, LogOut, UploadCloud, MessageCircle } from 'lucide-react';
import { useClerk } from "@clerk/clerk-react";

const Sidebar = ({ isOpen, toggle }) => {
    const { signOut } = useClerk();

    const navItems = [
        { path: '/chat', label: 'Chat Workspace', icon: MessageSquare },
    ];

    return (
        <aside className={`w-64 bg-[#090a0c] border-r border-white/10 flex flex-col h-screen fixed left-0 top-0 z-40 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center text-purple-500">
                        <MessageCircle size={20} className="fill-current" />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-white"><span className="text-purple-500">DOC</span>-GPT</span>
                </div>
                {/* Close Button for Mobile/Desktop */}
                <button
                    onClick={toggle}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <div className="md:hidden">
                        <LogOut size={20} className="rotate-180" /> {/* Re-using logout icon or generic X */}
                    </div>
                    <div className="hidden md:block">
                        <Settings size={20} className="rotate-90" /> {/* Placeholder icon or use ChevronLeft */}
                    </div>
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => window.innerWidth < 768 && toggle()} // Close on mobile click
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                ? 'bg-white/10 text-white'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`
                        }
                    >
                        <item.icon size={18} />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            {/* Footer Actions */}
            <div className="p-4 border-t border-white/10 space-y-1">
                <button
                    onClick={() => signOut()}
                    className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all text-left"
                >
                    <LogOut size={18} />
                    Logout
                </button>
            </div>

            {/* Copyright */}
            <div className="px-6 py-4 text-xs text-slate-600">
                © 2025 DOC-GPT. All rights reserved.
            </div>
        </aside>
    );
};

export default Sidebar;
