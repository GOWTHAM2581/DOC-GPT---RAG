import React, { useState, useEffect } from 'react';
import Upload from './components/Upload';
import Chat from './components/Chat';
import { getStatus, resetIndex } from './services/api';
import './index.css';
import {
    SignedIn,
    SignedOut,
    SignInButton,
    SignUpButton,
    UserButton,
} from "@clerk/clerk-react";

function App() {
    const [appState, setAppState] = useState('loading');
    const [documentInfo, setDocumentInfo] = useState(null);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const status = await getStatus();
            if (status.is_indexed) {
                setDocumentInfo(status);
                setAppState('chat');
            } else {
                setAppState('upload');
            }
        } catch (error) {
            console.error('Failed to check status:', error);
            setAppState('upload');
        }
    };

    const handleUploadComplete = (response) => {
        setDocumentInfo({
            is_indexed: true,
            document_name: response.document_name,
            indexed_at: new Date().toISOString(),
            total_chunks: response.chunks_created,
        });
        setAppState('chat');
    };

    const handleReset = async () => {
        try {
            await resetIndex();
            setDocumentInfo(null);
            setAppState('upload');
        } catch (error) {
            console.error('Failed to reset:', error);
        }
    };

    if (appState === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f1115]">
                <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
                <p className="text-slate-400 font-medium tracking-wide">Initializing DOC-GPT...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f1115] text-white">
            <header className="fixed top-0 left-0 right-0 h-16 border-b border-white/10 glass z-50 px-4 md:px-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/20">
                        D
                    </div>
                    <h1 className="text-lg md:text-xl font-bold tracking-tight">DOC-GPT</h1>
                </div>

                <div className="flex items-center gap-4">
                    {appState === 'chat' && (
                        <SignedIn>
                            <button
                                onClick={handleReset}
                                className="btn-ghost px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-sm flex items-center gap-2"
                            >
                                <span>New Analysis</span>
                            </button>
                        </SignedIn>
                    )}

                    <SignedOut>
                        <div className="flex items-center gap-2">
                            <SignInButton mode="modal">
                                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold transition-all">
                                    Sign In
                                </button>
                            </SignInButton>
                            <SignUpButton mode="modal">
                                <button className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-lg text-sm font-semibold transition-all">
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

            <main className="pt-16">
                <SignedOut>
                    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4 text-center">
                        <div className="max-w-2xl">
                            <h2 className="text-4xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                                Intelligent Document Intelligence
                            </h2>
                            <p className="text-slate-400 text-lg md:text-xl mb-8 leading-relaxed">
                                Experience the future of RAG. Upload, analyze, and chat with your documents using state-of-the-art AI.
                            </p>
                            <div className="flex flex-wrap justify-center gap-4">
                                <SignInButton mode="modal">
                                    <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-lg font-bold shadow-xl shadow-blue-600/30 transition-all transform hover:scale-105">
                                        Get Started Now
                                    </button>
                                </SignInButton>
                            </div>
                        </div>
                    </div>
                </SignedOut>

                <SignedIn>
                    {appState === 'upload' ? (
                        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4 md:p-6">
                            <Upload onUploadComplete={handleUploadComplete} />
                        </div>
                    ) : (
                        <Chat
                            documentName={documentInfo?.document_name || 'Document'}
                            totalChunks={documentInfo?.total_chunks || 0}
                            onReset={handleReset}
                        />
                    )}
                </SignedIn>
            </main>

            {/* Footer status - Hidden on mobile to prevent chat occlusion */}
            <div className="fixed bottom-4 right-4 z-50 hidden md:block">
                <SignedIn>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-[10px] font-bold text-green-400 uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        System Latency: Optimal
                    </div>
                </SignedIn>
            </div>
        </div>
    );
}

export default App;
