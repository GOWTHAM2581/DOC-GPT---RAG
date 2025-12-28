import React, { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { askQuestion } from '../services/api';
import { FileText, Send, Info, BookOpen, Clock, AlertCircle, CheckCircle, Settings, HelpCircle, UploadCloud, Menu } from 'lucide-react';

export default function Chat({ documentName, totalChunks, onReset, suggestions = [] }) {
    const { isSidebarOpen, toggleSidebar } = useOutletContext();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = {
            id: Date.now().toString(),
            type: 'user',
            content: input,
            timestamp: new Date(),
        };

        const currentMessages = [...messages, userMessage];
        setMessages(currentMessages);
        setInput('');
        setIsLoading(true);

        try {
            const response = await askQuestion(input, currentMessages);

            const assistantMessage = {
                id: (Date.now() + 1).toString(),
                type: 'assistant',
                content: response.answer,
                timestamp: new Date(),
                sources: response.source_chunks,
                confidence: response.confidence_score,
                hasRelevantData: response.has_relevant_data,
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                type: 'assistant',
                content: error.response?.data?.detail || 'An unexpected error occurred. Please try again.',
                timestamp: new Date(),
                hasRelevantData: false,
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh)]">


            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-[#0f1115] relative">
                {/* Header with Document Name and Upload Action */}
                <div className="h-16 border-b border-white/10 flex items-center px-6 justify-between bg-[#0f1115]">
                    <div className="flex items-center gap-3">
                        {/* Menu Trigger for Mobile/Collapsed Sidebar */}
                        <button
                            onClick={toggleSidebar}
                            className={`p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors ${isSidebarOpen ? 'md:hidden' : 'flex'}`}
                        >
                            <Menu size={20} />
                        </button>

                        <div className="flex items-center gap-2">
                            <FileText className="text-purple-500" size={20} />
                            <span className="font-semibold text-sm text-white">{documentName}</span>
                        </div>
                    </div>
                    <button
                        onClick={onReset}
                        className="flex items-center gap-2 px-3 py-1.5 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 rounded-lg text-xs font-medium transition-all border border-purple-500/20"
                    >
                        <UploadCloud size={14} />
                        New Analysis
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
                    <div className="max-w-4xl mx-auto space-y-8">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl mb-6">
                                    <BookOpen size={32} className="text-white" />
                                </div>
                                <h1 className="text-3xl font-bold mb-3">{documentName}</h1>
                                <p className="text-slate-400 max-w-lg mb-8">
                                    Ask any question about this document. Our advanced RAG engine will analyze specific chunks to provide accurate, cited answers.
                                </p>
                            </div>
                        )}

                        {messages.map((message) => (
                            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                                <div className={`flex gap-4 max-w-3xl ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {/* Avatar */}
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white/10 relative overflow-hidden">
                                        {message.type === 'user' ? (
                                            <img src="https://ui-avatars.com/api/?name=User&background=random" alt="User" />
                                        ) : (
                                            <div className="w-full h-full bg-green-500 flex items-center justify-center">
                                                <div className="w-4 h-4 bg-white rounded-full animate-pulse" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className={`space-y-2 ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div className={`p-5 rounded-2xl text-[15px] leading-relaxed ${message.type === 'user'
                                            ? 'bg-[#1a1d23] border border-white/10'
                                            : 'bg-transparent'
                                            }`}>
                                            <p className="whitespace-pre-wrap">{message.content}</p>
                                        </div>

                                        {/* AI Metadata: References, Provenance, Confidence */}
                                        {message.type === 'assistant' && message.hasRelevantData && (
                                            <div className="pl-5 space-y-3 w-full max-w-2xl bg-[#15171c] p-4 rounded-xl border border-white/5 mt-2">
                                                {/* References Tags */}
                                                <div className="flex flex-wrap gap-2 items-center">
                                                    <span className="text-xs font-semibold text-slate-500">References:</span>
                                                    {message.sources?.map((source, idx) => (
                                                        <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1f2937] text-blue-400 border border-blue-500/20">
                                                            {/* Check if page exists else show chunk id or similar */}
                                                            Page {source.page || source.id || idx + 1}
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* Provenance */}
                                                <div className="flex items-center gap-6 text-xs text-slate-400">
                                                    <div className="flex items-center gap-1.5 ">
                                                        <FileText size={12} />
                                                        <span>Provenance: <span className="text-white font-medium">{documentName}</span></span>
                                                    </div>
                                                    {message.confidence && (
                                                        <div className="flex items-center gap-1.5">
                                                            <CheckCircle size={12} className={message.confidence > 0.7 ? 'text-green-500' : 'text-yellow-500'} />
                                                            <span>Confidence: <span className="text-white font-medium">{Math.round(message.confidence * 100)}%</span></span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-6 border-t border-white/5 bg-[#0f1115]">
                    <div className="max-w-4xl mx-auto relative">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                            placeholder="Ask DOC-GPT about your document..."
                            className="w-full bg-[#15171c] border border-white/10 rounded-xl min-h-[60px] max-h-[200px] py-4 pl-4 pr-16 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 resize-none"
                            rows={1}
                        />
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading || !input.trim()}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:bg-slate-700 transition-all shadow-lg shadow-purple-500/20"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
