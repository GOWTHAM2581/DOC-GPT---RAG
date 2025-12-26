/**
 * API Service for RAG Backend
 * Handles all communication with FastAPI backend
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Upload a PDF document
 */
export const uploadDocument = async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
                const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress(progress);
            }
        },
    });

    return response.data;
};

/**
 * Get indexing status
 */
export const getStatus = async () => {
    const response = await api.get('/status');
    return response.data;
};

/**
 * Ask a question
 */
export const askQuestion = async (question, history = []) => {
    const response = await api.post('/ask', { question, history });
    return response.data;
};

/**
 * Reset the index
 */
export const resetIndex = async () => {
    await api.delete('/reset');
};

/**
 * Health check
 */
export const healthCheck = async () => {
    try {
        const response = await api.get('/');
        return response.status === 200;
    } catch {
        return false;
    }
};

export default api;
