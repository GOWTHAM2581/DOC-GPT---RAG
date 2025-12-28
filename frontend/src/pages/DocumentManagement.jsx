import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search, Filter, MoreHorizontal, FileText, CheckCircle, Clock, AlertCircle, Trash2, Calendar, UploadCloud, Menu } from 'lucide-react';
import { getDocuments, deleteDocument } from '../services/api';

const DocumentManagement = () => {
    const { documentInfo, onReset, isSidebarOpen, toggleSidebar } = useOutletContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [documents, setDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch documents from registry
    useEffect(() => {
        const fetchDocs = async () => {
            try {
                const docs = await getDocuments();
                setDocuments(docs);
            } catch (error) {
                console.error("Failed to load documents", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDocs();
    }, [documentInfo]); // Refresh when documentInfo changes (e.g. after new upload)

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to remove this document from history?")) return;
        try {
            await deleteDocument(id);
            setDocuments(prev => prev.filter(d => d.id !== id));
            // If we deleted the active one, maybe we should trigger reset? 
            // For now, independent history deletion is safer.
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    // Filter documents
    const filteredDocs = documents.filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <div className="flex items-center gap-4 mb-2">
                    <button
                        onClick={toggleSidebar}
                        className={`p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors ${isSidebarOpen ? 'md:hidden' : 'flex'}`}
                    >
                        <Menu size={24} />
                    </button>
                    <h1 className="text-3xl font-bold">Document Management</h1>
                </div>
                <p className="text-slate-400">Oversee all uploaded documents, track their indexing status, and perform essential management tasks efficiently.</p>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search documents..."
                        className="w-full bg-[#1a1d23] border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#1a1d23] border border-white/10 rounded-lg text-sm text-slate-300 hover:text-white hover:border-white/20 transition-all">
                        <Filter size={16} />
                        Filter by Status
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#1a1d23] border border-white/10 rounded-lg text-sm text-slate-300 hover:text-white hover:border-white/20 transition-all">
                        <Calendar size={16} />
                        Sort by Date
                    </button>
                    <button
                        onClick={onReset}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold text-white transition-all shadow-lg shadow-blue-600/20"
                    >
                        <UploadCloud size={16} />
                        New Analysis
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#1a1d23] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Document Name</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Upload Date</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Pages</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Chunks</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {filteredDocs.length > 0 ? (
                                filteredDocs.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-400">
                                                    <FileText size={16} />
                                                </div>
                                                <span className="font-medium text-white">{doc.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                            {new Date(doc.upload_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                            {doc.page_count || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                            {doc.chunk_count}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${doc.status === 'active'
                                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                                }`}>
                                                <CheckCircle size={12} />
                                                {doc.status === 'active' ? 'Active Index' : 'Indexed'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button
                                                onClick={() => handleDelete(doc.id)}
                                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                title="Delete Document"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                                                <FileText size={24} className="opacity-50" />
                                            </div>
                                            <p>{isLoading ? 'Loading documents...' : 'No documents found.'}</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DocumentManagement;
