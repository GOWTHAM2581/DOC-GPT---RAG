import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, Outlet, useOutletContext } from 'react-router-dom';
import { useAuth, SignedIn } from "@clerk/clerk-react";
import Upload from './components/Upload';
import Chat from './components/Chat';
import Sidebar from './components/Sidebar';
import DocumentManagement from './pages/DocumentManagement';
import Landing from './pages/Landing';
import { Header } from './components/Header';
import { getStatus, resetIndex } from './services/api';
import './index.css';

// Layout for Authenticated Pages that use Sidebar
const DashboardLayout = () => {
    const context = useOutletContext();
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="flex min-h-screen bg-[#0f1115]">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} />

            <main className={`flex-1 min-h-screen bg-[#0f1115] text-white overflow-hidden relative transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
                <Outlet context={{ ...context, isSidebarOpen, toggleSidebar }} />
            </main>
        </div>
    );
};

// Layout for Upload Page (Full screen with Header)
const UploadLayout = ({ onReset }) => {
    return (
        <div className="min-h-screen bg-[#0f1115] text-white pt-16">
            <Header onReset={onReset} />
            <Outlet />
        </div>
    );
};

const AppContent = () => {
    const { isSignedIn, isLoaded } = useAuth();
    const [documentInfo, setDocumentInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const init = async () => {
            if (isSignedIn) {
                try {
                    const status = await getStatus();
                    if (status.is_indexed) {
                        setDocumentInfo(status);
                    } else {
                        setDocumentInfo(null);
                    }
                } catch (error) {
                    console.error("Status check failed", error);
                    // If error, maybe assume not indexed or stay loading?
                    // Safe to assume not indexed for now if API fails (e.g. 404)
                    setDocumentInfo(null);
                }
            }
            setLoading(false);
        };
        if (isLoaded) {
            init();
        }
    }, [isLoaded, isSignedIn]);

    useEffect(() => {
        if (!loading && isSignedIn) {
            // Enforce flow: Index? -> Chat/Docs. No Index? -> Upload.

            // If trying to access chat/docs but no index, go to upload
            if (!documentInfo?.is_indexed && (location.pathname.startsWith('/chat') || location.pathname.startsWith('/documents'))) {
                navigate('/upload');
            }

            // If trying to access upload but index exists, go to chat (unless explicitly resetting, but reset clears index first)
            if (documentInfo?.is_indexed && location.pathname === '/upload') {
                navigate('/chat');
            }
        }
    }, [loading, isSignedIn, documentInfo, location.pathname, navigate]);

    if (!isLoaded || loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f1115]">
                <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
                <p className="text-slate-400 font-medium tracking-wide">Initializing DOC-GPT...</p>
            </div>
        );
    }

    const handleUploadComplete = (response) => {
        const newInfo = {
            is_indexed: true,
            document_name: response.document_name,
            indexed_at: new Date().toISOString(),
            total_chunks: response.chunks_created,
            suggestions: response.suggestions || []
        };
        setDocumentInfo(newInfo);
        navigate('/chat');
    };

    const handleReset = async () => {
        try {
            await resetIndex();
            setDocumentInfo(null);
            navigate('/upload');
        } catch (error) {
            console.error('Reset failed:', error);
        }
    };

    return (
        <Routes>
            <Route path="/" element={
                isSignedIn ? <Navigate to={documentInfo?.is_indexed ? "/chat" : "/upload"} /> :
                    <div className="min-h-screen bg-[#0f1115] text-white">
                        <Header />
                        <main className="pt-16"><Landing /></main>
                    </div>
            } />

            <Route element={<SignedIn><UploadLayout onReset={handleReset} /></SignedIn>}>
                <Route path="/upload" element={<div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4 md:p-6"><Upload onUploadComplete={handleUploadComplete} /></div>} />
            </Route>

            {/* Dashboard Layout wrapper passes context to Outlet via its own Context Provider or just direct Outlet context */}
            <Route element={<SignedIn><Outlet context={{ documentInfo, onReset: handleReset }} /></SignedIn>}>
                <Route element={<DashboardLayout />}>
                    <Route path="/chat" element={
                        <Chat
                            documentName={documentInfo?.document_name || 'Document'}
                            totalChunks={documentInfo?.total_chunks || 0}
                            suggestions={documentInfo?.suggestions}
                            onReset={handleReset}
                        />
                    } />
                    <Route path="/documents" element={<DocumentManagement />} />
                </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

function App() {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    );
}

export default App;
