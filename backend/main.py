"""
FastAPI Backend for RAG Application
Author: Senior Full-Stack AI Engineer
Purpose: Production-ready RAG API with anti-hallucination guardrails
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
import os
import json
from datetime import datetime

from rag.loader import PDFLoader, CSVLoader
from rag.chunker import TextChunker
from rag.embedder import EmbeddingGenerator
from rag.vector_store import VectorStore
from rag.qa import QuestionAnswerer
import uuid

from contextlib import asynccontextmanager

# Global components (Singleton pattern to prevent OOM)
global_embedder = None
global_vector_store = None
DOCUMENTS_REGISTRY = [] # In-memory registry
REGISTRY_FILE = os.path.join(os.path.dirname(__file__), "data", "registry.json")

def load_registry():
    global DOCUMENTS_REGISTRY
    if os.path.exists(REGISTRY_FILE):
        try:
            with open(REGISTRY_FILE, "r") as f:
                DOCUMENTS_REGISTRY = json.load(f)
        except:
            DOCUMENTS_REGISTRY = []

def save_registry():
    with open(REGISTRY_FILE, "w") as f:
        json.dump(DOCUMENTS_REGISTRY, f, indent=2)

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
        if global_vector_store.use_pinecone:
            indexing_state["is_indexed"] = True # For Pinecone, we assume it's ready or at least initialized
            load_registry()
            if DOCUMENTS_REGISTRY:
                last_doc = DOCUMENTS_REGISTRY[-1]
                indexing_state["document_name"] = last_doc["name"]
                indexing_state["indexed_at"] = last_doc["upload_date"]
                indexing_state["total_chunks"] = last_doc["total_chunks"]
            print(f"✅ Connected to Pinecone Index: {global_vector_store.index_name}")
        else:
            print("⚠️ Pinecone not enabled or failed to connect.")
        
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
    question: Optional[str] = None
    message: Optional[str] = None # Support 'message' from frontend
    history: Optional[list] = []
    currentUrl: Optional[str] = "default"
    sessionId: Optional[str] = None


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

@app.get("/status", response_model=StatusResponse)
async def get_status():
    """
    Get current indexing status
    """
    return StatusResponse(**indexing_state)

@app.post("/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...), currentUrl: str = Form("default")):
    """
    Upload and index a PDF or CSV document
    """
    try:
        # Validate file type
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in ['.pdf', '.csv']:
            raise HTTPException(status_code=400, detail="Only PDF and CSV files are supported")
        
        # Step 1: Save uploaded file
        upload_path = os.path.join(DATA_DIR, f"uploaded_document{file_ext}")
        with open(upload_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
            
        file_size = len(content)
        print(f"File saved: {file.filename} ({file_ext})")
        
        chunks_data = []
        suggestions = []
        total_pages = 0
        
        if file_ext == '.pdf':
            # Step 2: Extract text from PDF
            loader = PDFLoader()
            pages_text = loader.extract_text(upload_path)
            total_pages = len(pages_text)
            
            if not pages_text:
                raise HTTPException(status_code=400, detail="Could not extract text from PDF")
            
            # Step 3: Chunk with overlap
            chunker = TextChunker(chunk_size=400, overlap=80)
            chunks_data = chunker.create_chunks(pages_text)
            
            # Suggestion Generation Logic for PDFs
            try:
                potential_headings = []
                for page in pages_text[:5]:
                    lines = page['text'].split('\n')
                    for line in lines:
                        line = line.strip()
                        if 4 < len(line) < 50 and not line.endswith('.'):
                            if line.isupper() or line.istitle():
                                if not any(x in line.lower() for x in ['page', 'copyright', 'www', 'http']):
                                    potential_headings.append(line)
                
                unique_headings = sorted(list(set(potential_headings)), key=len, reverse=True)
                selected_topics = unique_headings[:3]
                
                if selected_topics:
                    for topic in selected_topics:
                        suggestions.append(f"Explain about {topic}")
            except:
                pass
                
        else: # .csv
            # Step 2: Extract text from CSV
            loader = CSVLoader()
            chunks_data = loader.extract_csv(upload_path)
            total_pages = 1
            
            if not chunks_data:
                raise HTTPException(status_code=400, detail="Could not extract data from CSV")
            
            # Suggestions for CSV
            suggestions = [
                "List all products",
                "What is the most expensive item?",
                "Give me a summary of these products"
            ]

        if not suggestions:
            suggestions = [f"Summarize {file.filename}", "Key takeaways"]
            
        suggestions = suggestions[:3]
        print(f"Created {len(chunks_data)} chunks/rows")
        
        # Step 4 & 5: Vector Store
        if global_vector_store is None:
             raise HTTPException(status_code=500, detail="Vector Store not initialized")
             
        global_vector_store.build_index(chunks_data, tenant_id=currentUrl)
        
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
        
        # Add to Registry
        new_doc_id = str(uuid.uuid4())
        doc_entry = {
            "id": new_doc_id,
            "document_id": new_doc_id, # Alias for strict compliance
            "name": file.filename,
            "original_filename": file.filename,
            "upload_date": indexing_state["indexed_at"],
            "upload_timestamp": indexing_state["indexed_at"], # ISO format
            "chunk_count": len(chunks_data),
            "total_chunks": len(chunks_data),
            "page_count": total_pages,
            "total_pages": total_pages,
            "file_size": file_size,
            "embedding_backend": "pinecone",
            "status": "indexed" # Strict requirements say "indexed" or "failed"
        }
        
        # Mark others as inactive (optional, since we only support one active for now)
        for d in DOCUMENTS_REGISTRY:
            d["status"] = "indexed"
            
        DOCUMENTS_REGISTRY.append(doc_entry)
        try:
            save_registry()
        except Exception as e:
            # "Fail loudly if registry write fails"
            # Rollback memory change
            DOCUMENTS_REGISTRY.pop()
            raise HTTPException(status_code=500, detail=f"Critical Registry Error: Failed to save metadata. {str(e)}")
        
        return UploadResponse(
            status="success",
            message=f"Successfully indexed {file.filename}",
            chunks_created=len(chunks_data),
            document_name=file.filename,
            suggestions=suggestions
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions (like file type validation)
        raise
    except Exception as e:
        error_msg = f"Error during document processing: {str(e)}"
        print(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)
@app.post("/documents/upload", response_model=UploadResponse)
async def upload_document_alias(file: UploadFile = File(...)):
    """
    Alias for /upload to meet strict API specs
    """
    return await upload_document(file)


@app.post("/ask", response_model=AskResponse)
@app.post("/chat", response_model=AskResponse)
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

        
        # Handle both 'question' and 'message' (for frontend compatibility)
        query = request.message or request.question
        
        if not query:
            raise HTTPException(status_code=400, detail="Question or message is required")
        
        # Get answer with anti-hallucination guardrails and history support
        # Pass currentUrl as tenant_id
        result = qa.answer_question(query, request.history, tenant_id=request.currentUrl)
        
        # Log for debugging
        print(f"Question: {query}")
        print(f"Confidence: {result.get('confidence', 0.0):.3f}")
        print(f"Has relevant data: {result.get('has_data', False)}")
        
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


@app.get("/documents")
async def get_documents():
    """
    Get list of all uploaded documents
    """
    return DOCUMENTS_REGISTRY

@app.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    """
    Delete a document from registry
    """
    global DOCUMENTS_REGISTRY
    
    # Remove from list
    initial_len = len(DOCUMENTS_REGISTRY)
    DOCUMENTS_REGISTRY = [d for d in DOCUMENTS_REGISTRY if d["id"] != doc_id]
    
    if len(DOCUMENTS_REGISTRY) < initial_len:
        save_registry()
        return {"status": "success", "message": "Document removed from history"}
    
    raise HTTPException(status_code=404, detail="Document not found")


if __name__ == "__main__":
    import uvicorn
    # Use PORT environment variable for Render deployment
    port = int(os.getenv("PORT", 9000))
    # Disable reload in production for better performance
    reload = os.getenv("ENVIRONMENT") == "development"
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=reload)
