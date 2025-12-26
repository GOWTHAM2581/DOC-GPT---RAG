import React, { useState, useRef, useEffect } from 'react';
import { askQuestion } from '../services/api';

export default function Chat({ documentName, totalChunks, onReset }) {
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
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto py-6 md:py-10 px-4 md:px-6">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-10 md:py-20 text-center">
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6">
                                <span className="text-2xl md:text-3xl">📄</span>
                            </div>
                            <h2 className="text-xl md:text-2xl font-bold mb-2 px-4 leading-tight">Analyzing: {documentName}</h2>
                            <p className="text-slate-400 max-w-sm text-sm md:text-base px-6">
                                Ask specific questions about the document. I will provide precise answers based on the {totalChunks} indexed segments.
                            </p>
                            <div className="mt-8 grid grid-cols-1 gap-3 w-full max-w-md px-4">
                                <button
                                    onClick={() => setInput("What are the key takeaways?")}
                                    className="p-4 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 text-left text-xs md:text-sm transition-colors"
                                >
                                    Summarize the main points
                                </button>
                                <button
                                    onClick={() => setInput("Identify all mentioned skills or requirements.")}
                                    className="p-4 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 text-left text-xs md:text-sm transition-colors"
                                >
                                    List technical requirements
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-8 md:space-y-12">
                        {messages.map((message) => (
                            <div key={message.id} className="flex flex-col gap-3 md:gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className={`flex gap-3 md:gap-4 ${message.type === 'user' ? 'bg-white/5 p-4 md:p-6 rounded-2xl' : ''}`}>
                                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded shrink-0 flex items-center justify-center font-bold text-[10px] md:text-sm ${message.type === 'user' ? 'bg-indigo-600' : 'bg-blue-600'}`}>
                                        {message.type === 'user' ? 'U' : 'D'}
                                    </div>
                                    <div className="flex-1 space-y-3 md:space-y-4 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                {message.type === 'user' ? 'You' : 'DOC-GPT'}
                                            </span>
                                        </div>
                                        <div className="prose prose-invert max-w-none">
                                            <p className="text-slate-100 whitespace-pre-wrap leading-relaxed text-sm md:text-[15px] break-words">
                                                {message.content}
                                            </p>
                                        </div>

                                        {message.hasRelevantData && message.sources && message.sources.length > 0 && (
                                            <div className="mt-6 md:mt-8">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-500">Source Fragments</span>
                                                    <div className="h-px flex-1 bg-white/5" />
                                                </div>
                                                <div className="grid grid-cols-1 gap-3">
                                                    {message.sources.map((source, idx) => (
                                                        <div key={idx} className="p-3 bg-[#1a1d23] rounded-lg border border-white/5 text-[10px] md:text-[11px] text-slate-400 shadow-sm transition-all hover:bg-white/[0.02]">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-md font-bold text-[9px] md:text-[10px] tracking-tight border border-blue-500/20">
                                                                    PAGE {source.page}
                                                                </span>
                                                            </div>
                                                            <div className="italic leading-relaxed opacity-80 break-words">
                                                                " {source.text.substring(0, 180)}... "
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-4 items-start px-2">
                                <div className="w-7 h-7 md:w-8 md:h-8 rounded shrink-0 flex items-center justify-center font-bold text-[10px] md:text-sm bg-blue-600">
                                    D
                                </div>
                                <div className="flex gap-1.5 mt-3">
                                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            </div>

            {/* Input Area - Adjusted for button alignment and responsiveness */}
            <div className="p-4 md:p-6 bg-gradient-to-t from-[#0f1115] via-[#0f1115] to-transparent">
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask me anything..."
                        disabled={isLoading}
                        className="w-full bg-[#1a1d23] border border-white/10 rounded-2xl px-5 py-3.5 md:px-6 md:py-4 pr-14 md:pr-16 text-sm md:text-base text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-all shadow-2xl"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="absolute right-2 md:right-3 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-blue-600 text-white disabled:opacity-20 disabled:bg-slate-800 transition-all hover:bg-blue-500 shadow-lg"
                    >
                        {isLoading ? (
                            <div className="w-3.5 h-3.5 md:w-4 md:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                        )}
                    </button>
                </form>
                <p className="text-[9px] md:text-[10px] text-center mt-3 text-slate-500 uppercase tracking-widest font-medium">
                    Verified retrieval from {documentName.substring(0, 30)}{documentName.length > 30 ? '...' : ''}
                </p>
            </div>
        </div>
    );
}
