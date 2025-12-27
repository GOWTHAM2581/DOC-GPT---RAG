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
            suggestions: response.suggestions || []
        });
        setAppState('chat');
    };

    // ... (keep handleReset)

    // ... (inside return)
    <Chat
        documentName={documentInfo?.document_name || 'Document'}
        totalChunks={documentInfo?.total_chunks || 0}
        suggestions={documentInfo?.suggestions}
        onReset={handleReset}
    />
                </SignedIn >
            </main >

        {/* Footer status - Hidden on mobile to prevent chat occlusion */ }
        < div className = "fixed bottom-4 right-4 z-50 hidden md:block" >
            <SignedIn>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-[10px] font-bold text-green-400 uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    System Latency: Optimal
                </div>
            </SignedIn>
            </div >
        </div >
    );
}

export default App;
