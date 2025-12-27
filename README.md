---
title: Doc Gpt Backend
emoji: 🦀
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
app_port: 7860
---
# RAG Document Q&A Application

A production-ready Retrieval-Augmented Generation (RAG) system with strict anti-hallucination guardrails.

## 🎯 Features

### Backend (FastAPI)
- ✅ **Modular RAG Architecture**
  - PDF text extraction (page-wise)
  - Text chunking with overlap (500 chars, 100 overlap)
  - Sentence Transformer embeddings (all-MiniLM-L6-v2)
  - FAISS vector database (local)
  - Context-only Q&A with LLM

- ✅ **Anti-Hallucination Guardrails**
  - **Similarity Threshold**: 0.75 minimum score
  - **Explicit "No Data" Response**: If relevance < threshold
  - **Context-Only Prompting**: LLM forbidden from using external knowledge
  - **Confidence Scoring**: Returns similarity scores
  - **Source Attribution**: Shows which chunks were used

### Frontend (React + Vite)
- ✅ **Modern Animated UI**
  - Framer Motion animations
  - Glassmorphism design
  - Drag & drop PDF upload
  - Animated progress stages
  - Chat-style Q&A interface

- ✅ **UX Features**
  - Progress visualization (uploading → chunking → embedding → indexing)
  - Real-time confidence scores
  - Source citations with page numbers
  - Loading animations
  - Anti-hallucination notice

## 🚀 Quick Start

### Backend Setup

```bash
cd backend
pip install -r requirements.txt

# Optional: Set OpenAI API key for better answers
export OPENAI_API_KEY="your-key-here"  # Linux/Mac
set OPENAI_API_KEY=your-key-here       # Windows

# Run server
python main.py
# Server runs on http://localhost:8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

## 📁 Project Structure

```
rag-app/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── rag/
│   │   ├── __init__.py
│   │   ├── loader.py          # PDF text extraction
│   │   ├── chunker.py         # Text chunking with overlap
│   │   ├── embedder.py        # Sentence Transformer embeddings
│   │   ├── vector_store.py    # FAISS vector database
│   │   └── qa.py              # Q&A with anti-hallucination
│   ├── data/                  # Generated files
│   │   ├── vectors.index      # FAISS index
│   │   ├── chunks.json        # Chunk metadata
│   │   └── uploaded_document.pdf
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Upload.tsx     # Drag & drop upload
    │   │   └── Chat.tsx       # Q&A interface
    │   ├── services/
    │   │   └── api.ts         # Backend API client
    │   ├── App.tsx            # Main app
    │   ├── main.tsx
    │   └── index.css          # Tailwind + custom styles
    ├── index.html
    ├── package.json
    └── tailwind.config.js
```

## 🧠 RAG Flow

### 1. Document Upload
```
PDF → Extract Text (page-wise) → Chunk (500/100) → Embed → Store in FAISS
```

### 2. Question Answering
```
Question → Embed → Search FAISS → Apply Threshold → Generate Answer
                                         ↓
                                    < 0.75 score?
                                         ↓
                        Yes → "No relevant data found"
                        No  → Answer from context ONLY
```

## 🛡️ Anti-Hallucination Guardrails

### 1. **Similarity Threshold Check**
```python
if top_score < 0.75:
    return "No relevant information found in the uploaded document."
```

### 2. **Context-Only System Prompt**
```python
system_prompt = """
You are a document Q&A assistant. Your ONLY job is to answer 
questions based STRICTLY on the provided context.

CRITICAL RULES:
1. ONLY use information from the provided context
2. NEVER use external knowledge or training data
3. If context doesn't contain the answer, say so explicitly
"""
```

### 3. **Explicit Messaging**
- User sees "No relevant data found" instead of hallucinated answer
- Confidence scores visible in UI
- Source chunks shown with page numbers

## 🎨 UI Features

### Animations (Framer Motion)
- **Upload Screen**: Fade-in, drag hover effects
- **Progress Bar**: Shimmer animation, stage transitions
- **Chat Messages**: Slide-up entrance animations
- **Loading States**: Pulsing dots, rotating spinners

### Design System
- **Glassmorphism**: Semi-transparent cards with backdrop blur
- **Gradient Text**: Primary color gradients
- **Dark Mode**: Sophisticated dark palette
- **Custom Scrollbars**: Styled to match theme

## 🔧 Configuration

### Backend
- **Chunk Size**: 500 characters (adjustable in `chunker.py`)
- **Overlap**: 100 characters
- **Threshold**: 0.75 similarity (adjustable in `main.py`)
- **Embedding Model**: all-MiniLM-L6-v2 (can switch to OpenAI)
- **LLM**: OpenAI GPT-3.5 (optional, falls back to simple concatenation)

### Frontend
- **API Base URL**: `http://localhost:8000` (in `services/api.ts`)
- **Colors**: Configured in `tailwind.config.js`
- **Animations**: Configured via Framer Motion props

## 📊 API Endpoints

### `POST /upload`
Upload PDF and create vector index
- **Input**: PDF file (multipart/form-data)
- **Output**: `{ status, message, chunks_created, document_name }`

### `POST /ask`
Ask a question
- **Input**: `{ question: string }`
- **Output**: `{ answer, source_chunks, confidence_score, has_relevant_data }`

### `GET /status`
Check indexing status
- **Output**: `{ is_indexed, document_name, indexed_at, total_chunks }`

### `DELETE /reset`
Reset index (upload new document)

## 🎯 Interview Talking Points

### Architecture Decisions
1. **Modular Design**: Separated concerns (loader, chunker, embedder, store, QA)
2. **Threshold-Based Retrieval**: Prevents low-quality matches
3. **Context-Only Answering**: System prompt explicitly forbids hallucination
4. **Source Attribution**: Transparency and verifiability

### Scaling Considerations
1. **Vector Store**: FAISS → Pinecone/Weaviate for production
2. **Embeddings**: Sentence Transformers → OpenAI for better quality
3. **Storage**: Local files → Cloud storage (S3)
4. **Caching**: Add Redis for frequently asked questions

### Future Enhancements
1. Multi-document support
2. Semantic caching for faster responses
3. Query rewriting for better retrieval
4. Hybrid search (keyword + vector)
5. User feedback loop for continuous improvement

## 📝 Requirements

### Backend
- Python 3.8+
- FastAPI, Uvicorn
- PyPDF2
- sentence-transformers
- faiss-cpu
- OpenAI (optional)

### Frontend
- Node.js 16+
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Axios

## 🚀 Production Deployment

### Backend
```bash
# Use production ASGI server
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Frontend
```bash
npm run build
# Serve with nginx or deploy to Vercel/Netlify
```

## 📜 License

MIT

---

**Built with ❤️ for interview excellence and production readiness**
