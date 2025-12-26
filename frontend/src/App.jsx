import React, { useState, useEffect } from 'react';
import Upload from './components/Upload';
import Chat from './components/Chat';
import { getStatus, resetIndex } from './services/api';
import './index.css';

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

                {appState === 'chat' && (
                    <button
                        onClick={handleReset}
                        className="btn-ghost px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-sm flex items-center gap-2"
                    >
                        <span>New Analysis</span>
                    </button>
                )}
            </header>

            <main className="pt-16">
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
            </main>

            {/* Footer status - Hidden on mobile to prevent chat occlusion */}
            <div className="fixed bottom-4 right-4 z-50 hidden md:block">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-[10px] font-bold text-green-400 uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    System Latency: Optimal
                </div>
            </div>
        </div>
    );
}

export default App;
