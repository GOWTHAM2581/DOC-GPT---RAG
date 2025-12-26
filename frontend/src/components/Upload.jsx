import React, { useState, useCallback } from 'react';
import { uploadDocument } from '../services/api';

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
        <div className="w-full max-w-xl px-4 md:px-0">
            <div className="text-center mb-10 space-y-3">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white font-display">
                    DOC-GPT
                </h1>
                <p className="text-slate-400 text-sm md:text-lg">
                    Premium Document Intelligence & Q&A
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 pt-2">
                    <span className="text-[8px] md:text-[10px] font-bold tracking-widest uppercase px-2 md:px-3 py-1 bg-white/5 border border-white/10 rounded text-slate-500">
                        Secure AI Retrieval
                    </span>
                    <span className="text-[8px] md:text-[10px] font-bold tracking-widest uppercase px-2 md:px-3 py-1 bg-white/5 border border-white/10 rounded text-slate-500">
                        Encrypted Analysis
                    </span>
                </div>
            </div>

            {!isUploading ? (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                        relative group p-8 md:p-12 rounded-2xl border-2 border-dashed 
                        transition-all duration-300 cursor-pointer
                        ${isDragging
                            ? 'border-blue-500 bg-blue-500/5 shadow-2xl shadow-blue-500/10'
                            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]'}
                    `}
                >
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileInput}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />

                    <div className="text-center space-y-6 pointer-events-none">
                        <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-3xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                            <svg className="w-8 h-8 md:w-10 md:h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>

                        <div className="space-y-2 px-2">
                            <h3 className="text-lg md:text-xl font-bold text-white leading-tight">
                                {isDragging ? 'Drop to start analysis' : 'Upload Document'}
                            </h3>
                            <p className="text-slate-400 text-xs md:text-sm">
                                Drag and drop your PDF here, or click to browse
                            </p>
                        </div>

                        <div className="text-[10px] md:text-[11px] text-slate-600 font-medium">
                            Only PDF files are supported for semantic analysis.
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-6 md:p-10 rounded-2xl bg-white/5 border border-white/10 space-y-8 animate-in fade-in duration-500">
                    <div className="text-center space-y-2">
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 transition-all duration-500 ease-out"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest pt-2">
                            <span className="truncate pr-4">{uploadStage}</span>
                            <span className="text-blue-500 shrink-0">{uploadProgress}%</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        {[
                            { id: 1, label: 'Document Verification', threshold: 30 },
                            { id: 2, label: 'Semantic Chunking', threshold: 50 },
                            { id: 3, label: 'Embedding Generation', threshold: 75 },
                            { id: 4, label: 'Index Optimization', threshold: 100 }
                        ].map((step) => (
                            <div key={step.id} className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5">
                                <span className={`text-[10px] md:text-xs font-medium ${uploadProgress >= step.threshold ? 'text-white' : 'text-slate-600'}`}>
                                    {step.label}
                                </span>
                                {uploadProgress >= step.threshold ? (
                                    <svg className="w-3 h-3 md:w-4 md:h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-slate-800 animate-pulse" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {error && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl animate-in slide-in-from-top-2 duration-300">
                    <p className="red-400 text-center text-xs md:text-sm font-medium">{error}</p>
                </div>
            )}
        </div>
    );
}
