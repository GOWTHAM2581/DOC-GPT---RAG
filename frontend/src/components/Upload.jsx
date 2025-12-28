import React, { useState, useCallback } from 'react';
import { uploadDocument } from '../services/api';
import { UploadCloud, FileText, CheckCircle, Shield, Layers, Eye } from 'lucide-react';

export default function Upload({ onUploadComplete }) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStage, setUploadStage] = useState('');
    const [error, setError] = useState('');

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(async (e) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        const pdfFile = files.find(f => f.type === 'application/pdf');

        if (pdfFile) {
            await handleUpload(pdfFile);
        } else {
            setError('Please upload a valid PDF document.');
            setTimeout(() => setError(''), 3000);
        }
    }, []);

    const handleFileInput = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (file) {
            await handleUpload(file);
        }
    }, []);

    const handleUpload = async (file) => {
        setError('');
        setIsUploading(true);
        setUploadProgress(0);

        try {
            setUploadStage('Initializing secure upload...');

            const response = await uploadDocument(file, (progress) => {
                setUploadProgress(Math.min(progress, 30));
            });

            setUploadStage('Extracting semantic content...');
            setUploadProgress(50);
            await new Promise(resolve => setTimeout(resolve, 600));

            setUploadStage('Generating high-dimensional embeddings...');
            setUploadProgress(75);
            await new Promise(resolve => setTimeout(resolve, 600));

            setUploadStage('Building vector search index...');
            setUploadProgress(90);
            await new Promise(resolve => setTimeout(resolve, 600));

            setUploadStage('Finalizing analysis...');
            setUploadProgress(100);

            await new Promise(resolve => setTimeout(resolve, 400));
            onUploadComplete(response);
        } catch (err) {
            setError(err.response?.data?.detail || 'Analysis failed. Please check your document and try again.');
            setIsUploading(false);
            setUploadProgress(0);
            setUploadStage('');
        }
    };

    return (
        <div className="w-full h-full flex items-center justify-center px-4">

            {!isUploading ? (
                <div className="w-full max-w-2xl text-center">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-5xl md:text-6xl font-bold mb-4">
                            <span className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 bg-clip-text text-transparent">DOC-GPT</span>
                        </h1>
                        <p className="text-slate-400 text-lg mb-6">Premium Document Intelligence & Q&A</p>

                        {/* Badges */}
                        <div className="flex items-center justify-center gap-3 mb-12">
                            <span className="px-4 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-full text-xs font-medium text-purple-400 uppercase tracking-wider">
                                Secure AI Retrieval
                            </span>
                            <span className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full text-xs font-medium text-blue-400 uppercase tracking-wider">
                                Encrypted Analysis
                            </span>
                        </div>
                    </div>

                    {/* Upload Area */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`
                        relative group p-16 rounded-2xl border-2 border-dashed 
                        transition-all duration-300 cursor-pointer
                        ${isDragging
                                ? 'border-purple-500 bg-purple-500/5 shadow-2xl shadow-purple-500/10 scale-[1.02]'
                                : 'border-white/10 bg-[#1a1d23]/50 hover:border-purple-500/30 hover:bg-[#1a1d23]'}
                    `}
                    >
                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileInput}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />

                        <div className="text-center space-y-6 pointer-events-none">
                            {/* Icon */}
                            <div className="flex justify-center mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center">
                                    <UploadCloud size={32} className="text-purple-500" />
                                </div>
                            </div>

                            {/* Text */}
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Upload Document</h3>
                                <p className="text-slate-400 text-sm mb-1">Drag and drop your PDF here, or click to browse</p>
                                <p className="text-slate-600 text-xs">Only PDF files are supported for semantic analysis.</p>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl animate-in slide-in-from-top-2 duration-300">
                            <p className="text-red-400 text-center text-sm font-medium">{error}</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="w-full max-w-xl p-8 rounded-2xl bg-[#1a1d23] border border-white/10 space-y-8 animate-in fade-in duration-500">
                    <div className="text-center space-y-4">
                        {/* Visual Steps */}
                        <div className="flex justify-between items-center px-4 mb-8">
                            {['Upload', 'Chunking', 'Embeddings', 'Indexed'].map((step, i) => {
                                const stepIdx = i + 1;
                                // Simple logic to determine if step is active or done based on progress
                                let status = 'pending';
                                if (stepIdx === 1) status = 'done';
                                if (stepIdx === 2 && uploadProgress >= 50) status = 'done';
                                else if (stepIdx === 2 && uploadProgress > 0) status = 'active';

                                if (stepIdx === 3 && uploadProgress >= 75) status = 'done';
                                else if (stepIdx === 3 && uploadProgress >= 50) status = 'active';

                                if (stepIdx === 4 && uploadProgress >= 100) status = 'done';
                                else if (stepIdx === 4 && uploadProgress >= 90) status = 'active';

                                return (
                                    <div key={step} className="flex flex-col items-center gap-2">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${status === 'done' ? 'bg-purple-600 border-purple-600 text-white' :
                                            status === 'active' ? 'bg-purple-600/20 border-purple-500 text-purple-400 animate-pulse' :
                                                'bg-transparent border-white/10 text-slate-500'
                                            }`}>
                                            {status === 'done' ? <CheckCircle size={16} /> :
                                                stepIdx === 1 ? <UploadCloud size={16} /> :
                                                    stepIdx === 2 ? <Layers size={16} /> :
                                                        stepIdx === 3 ? <FileText size={16} /> :
                                                            <CheckCircle size={16} />
                                            }
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${status !== 'pending' ? 'text-white' : 'text-slate-600'
                                            }`}>{step}</span>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-500 ease-out"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest pt-2">
                            <span className="truncate pr-4">{uploadStage}</span>
                            <span className="text-purple-500 shrink-0">{uploadProgress}%</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
