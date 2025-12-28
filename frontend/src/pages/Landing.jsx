import React from 'react';
import { SignInButton } from "@clerk/clerk-react";
import { Brain, Lock, MessageSquare, MessageCircle } from 'lucide-react';

const Landing = () => {
    return (
        <div className="flex flex-col min-h-[calc(100vh-64px)] bg-[#1a1b1e]">

            {/* Hero Section - Takes most of viewport */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-32 min-h-[70vh]">
                <div className="max-w-3xl text-center">
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
                        <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Intelligent </span>
                        <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Document</span>
                        <br />
                        <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Intelligence</span>
                    </h1>

                    <p className="text-slate-400 text-base md:text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
                        Experience the future of RAG. Upload, analyze, and chat with your documents using state-of-the-art AI. Unlock insights with precision and ease.
                    </p>

                    <div className="flex justify-center">
                        <SignInButton mode="modal">
                            <button className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-full text-base font-semibold text-white transition-all transform hover:scale-105 shadow-lg shadow-purple-500/25">
                                Get Started Now
                            </button>
                        </SignInButton>
                    </div>
                </div>
            </div>

            {/* Features Section - Pushed to bottom */}
            <div className="px-4 py-16 md:px-8 max-w-6xl mx-auto w-full">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-white">Key Capabilities</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Feature 1 */}
                    <div className="p-6 rounded-2xl bg-[#25262b] border border-purple-500/10 hover:border-purple-500/30 transition-all">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center text-cyan-400 mb-5">
                            <Brain size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">AI-Powered Analysis</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Leverage advanced AI to quickly extract key information, summarize complex data, and understand document context.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="p-6 rounded-2xl bg-[#25262b] border border-purple-500/10 hover:border-purple-500/30 transition-all">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-purple-400 mb-5">
                            <Lock size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Secure Document Handling</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Your data's security is our priority. Encrypted storage and strict access controls ensure your documents are safe.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="p-6 rounded-2xl bg-[#25262b] border border-purple-500/10 hover:border-purple-500/30 transition-all">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center text-blue-400 mb-5">
                            <MessageSquare size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Intuitive Chat Interface</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Engage with your documents in a natural language chat. Ask questions, get answers, and explore insights effortlessly.
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/5 py-6 bg-[#1a1b1e]">
                <div className="max-w-6xl mx-auto px-4 flex items-center justify-center">
                    <div className="flex items-center gap-2">
                        <MessageCircle size={16} className="text-purple-500 fill-current" />
                        <span className="text-sm font-bold text-purple-500">DOC-GPT</span>
                        <span className="text-sm text-slate-600">© 2025 DOC-GPT. All rights reserved.</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Landing;
