"""
FastAPI Backend for RAG Application
Author: Senior Full-Stack AI Engineer
Purpose: Production-ready RAG API with anti-hallucination guardrails
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
import json
from datetime import datetime

from rag.loader import PDFLoader
from rag.chunker import TextChunker
from rag.embedder import EmbeddingGenerator
from rag.vector_store import VectorStore
from rag.qa import QuestionAnswerer

from contextlib import asynccontextmanager

# Global components (Singleton pattern to prevent OOM)
global_embedder = None
global_vector_store = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Load heavy AI models once on startup
    """
    global global_embedder, global_vector_store
    print("🚀 Starting up: Loading AI Models...")
    try:
        global_embedder = EmbeddingGenerator()
        global_vector_store = VectorStore(global_embedder)
        
        # Determine initial indexing state
        if global_vector_store.use_supabase:
            # Check if we have data in Supabase (simple check)
            try:
                res = global_vector_store.supabase.table("documents").select("id", count="exact").limit(1).execute()
                count = res.count
                if count and count > 0:
                    indexing_state["is_indexed"] = True
                    indexing_state["total_chunks"] = count
                    print(f"✅ Detected {count} existing chunks in Supabase")
            except Exception as e:
                print(f"⚠️ Could not check Supabase status: {e}")
        else:
            # Check local files
            if os.path.exists(os.path.join(DATA_DIR, "vectors.index")):
                 try:
                    global_vector_store.load_index(os.path.join(DATA_DIR, "vectors.index"))
                    indexing_state["is_indexed"] = True
                    print("✅ Loaded existing FAISS index from disk")
                 except:
                    print("⚠️ Failed to load existing index")
                    
        print("✅ Startup complete")
    except Exception as e:
        print(f"❌ Startup Error: {e}")
    
    yield
    
    # Clean up
    print("🛑 Shutting down...")

# Initialize FastAPI app
app = FastAPI(
    title="RAG Document Q&A API",
    description="Anti-hallucination RAG system with strict threshold guardrails",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration - Load from environment for production
origins_env = os.getenv("CORS_ORIGINS", "")
CORS_ORIGINS = origins_env.split(",") if origins_env else []

# Always include development and production URLs
default_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://doc-gpt-rag.vercel.app"
]

# Merge unique origins
CORS_ORIGINS = list(set(CORS_ORIGINS + default_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data directory for persistent storage
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)

# Global state to track indexing
indexing_state = {
    "is_indexed": False,
    "document_name": None,
    "indexed_at": None,
    "total_chunks": 0
}


# Request/Response models updated
class AskRequest(BaseModel):
    question: str
    history: Optional[list] = []


class AskResponse(BaseModel):
    answer: str
    source_chunks: Optional[list] = []
    confidence_score: Optional[float] = None
    has_relevant_data: bool


class UploadResponse(BaseModel):
    status: str
    message: str
    chunks_created: int
    document_name: str
    suggestions: Optional[list] = []


class StatusResponse(BaseModel):
    is_indexed: bool
    document_name: Optional[str]
    indexed_at: Optional[str]
    total_chunks: int
    suggestions: Optional[list] = []

# ... [Keep existing code] ...

@app.post("/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """
    Upload and index a PDF document
    """
    try:
        # Validate file type
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Step 1: Save uploaded file
        upload_path = os.path.join(DATA_DIR, "uploaded_document.pdf")
        with open(upload_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        print(f"File saved: {file.filename}")
        
        # Step 2: Extract text from PDF
        loader = PDFLoader()
        pages_text = loader.extract_text(upload_path)
        
        if not pages_text:
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")
        
        print(f"Extracted text from {len(pages_text)} pages")
        
        # --- Suggestion Generation Logic (Simple Heuristic for Free Tier) ---
        suggestions = []
        try:
            # 1. Gather potential headings from first few pages
            potential_headings = []
            for page in pages_text[:5]: # Check first 5 pages
                lines = page['text'].split('\n')
                for line in lines:
                    line = line.strip()
                    # Check for "Heading-like" properties: Short, casing, no period
                    if 4 < len(line) < 50 and not line.endswith('.'):
                        if line.isupper() or line.istitle():
                            # Remove common junk
                            if not any(x in line.lower() for x in ['page', 'copyright', 'www', 'http']):
                                potential_headings.append(line)
            
            # 2. Filter and create questions
            unique_headings = sorted(list(set(potential_headings)), key=len, reverse=True)
            
            # Select top 3 interesting headings
            selected_topics = unique_headings[:3]
            
            if selected_topics:
                 for topic in selected_topics:
                     suggestions.append(f"Explain about {topic}")
            else:
                 # Fallback if no clean headings found
                 suggestions = [
                     f"Summarize the main points of {file.filename}",
                     "What are the key technical requirements?",
                     "List the important conclusions"
                 ]
                 
            # Limit to 3
            suggestions = suggestions[:3]
            
        except Exception as e:
            print(f"Suggestion generation error: {e}")
            suggestions = [f"Summarize {file.filename}", "Key takeaways"]

        
        # Step 3: Chunk with overlap
        chunker = TextChunker(chunk_size=400, overlap=80)
        chunks_data = chunker.create_chunks(pages_text)
        
        print(f"Created {len(chunks_data)} chunks")
        
        # Step 4 & 5: Vector Store
        if global_vector_store is None:
             raise HTTPException(status_code=500, detail="Vector Store not initialized")
             
        global_vector_store.build_index(chunks_data)
        
        print(f"Generated embeddings and built index")
        
        # Step 6: Save metadata
        chunks_path = os.path.join(DATA_DIR, "chunks.json")
        with open(chunks_path, "w", encoding="utf-8") as f:
            json.dump(chunks_data, f, indent=2, ensure_ascii=False)
        
        global_vector_store.save_index(os.path.join(DATA_DIR, "vectors.index"))
        
        print(f"Index processing complete")
        
        # Update indexing state
        indexing_state["is_indexed"] = True
        indexing_state["document_name"] = file.filename
        indexing_state["indexed_at"] = datetime.now().isoformat()
        indexing_state["total_chunks"] = len(chunks_data)
        indexing_state["suggestions"] = suggestions # Store in memory
        
        return UploadResponse(
            status="success",
            message=f"Successfully indexed {file.filename}",
            chunks_created=len(chunks_data),
            document_name=file.filename,
            suggestions=suggestions
        )
        
    except Exception as e:
        print(f"Error during upload: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@app.post("/ask", response_model=AskResponse)
async def ask_question(request: AskRequest):
    """
    Answer questions using RAG with strict anti-hallucination guardrails
    
    Flow:
    1. Check if document is indexed
    2. Embed user question
    3. Search FAISS for relevant chunks
    4. Retrieve top-k relevant chunks using FAISS
    5. If no chunks are retrieved → return "No relevant data found"
    6. Otherwise → generate answer strictly from retrieved context
    
    Anti-hallucination: NEVER answers without relevant context
    """
    try:
        # Guard: Check if document is indexed
        if not indexing_state["is_indexed"]:
            raise HTTPException(
                status_code=400,
                detail="No document indexed. Please upload a document first."
            )
        
        # Load chunks metadata
        # Load chunks metadata (needed for FAISS fallback)
        chunks_data = []
        chunks_path = os.path.join(DATA_DIR, "chunks.json")
        if os.path.exists(chunks_path):
            with open(chunks_path, "r", encoding="utf-8") as f:
                chunks_data = json.load(f)
        
        # Initialize components - USE GLOBAL
        if global_vector_store is None:
             raise HTTPException(status_code=500, detail="Vector Store not initialized")
        
        # Only load local index if NOT using Supabase (and using FAISS)
        # We already loaded in lifespan, but if Supabase is used, we don't need load_index
        # If FAISS is used, it's already in memory in global_vector_store
        
        qa = QuestionAnswerer(
            vector_store=global_vector_store,
            chunks_data=chunks_data,
            top_k=3,
            use_llm=True
        )

        
        # Get answer with anti-hallucination guardrails and history support
        result = qa.answer_question(request.question, request.history)
        
        # Log for debugging
        print(f"Question: {request.question}")
        print(f"Confidence: {result['confidence_score']:.3f}")
        print(f"Has relevant data: {result['has_relevant_data']}")
        
        return AskResponse(
            answer=result["answer"],
            source_chunks=result.get("source_chunks", []),
            confidence_score=result.get("confidence_score"),
            has_relevant_data=result["has_relevant_data"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error during Q&A: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Q&A failed: {str(e)}")


@app.delete("/reset")
async def reset_index():
    """
    Reset the indexed document
    Useful for uploading a new document
    """
    try:
        # Clear files
        files_to_remove = [
            os.path.join(DATA_DIR, "uploaded_document.pdf"),
            os.path.join(DATA_DIR, "chunks.json"),
            os.path.join(DATA_DIR, "vectors.index")
        ]
        
        for file_path in files_to_remove:
            if os.path.exists(file_path):
                os.remove(file_path)
        
        # Reset state
        indexing_state["is_indexed"] = False
        indexing_state["document_name"] = None
        indexing_state["indexed_at"] = None
        indexing_state["total_chunks"] = 0
        
        return {"status": "success", "message": "Index reset successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reset failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    # Use PORT environment variable for Render deployment
    port = int(os.getenv("PORT", 8000))
    # Disable reload in production for better performance
    reload = os.getenv("ENVIRONMENT") == "development"
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=reload)
