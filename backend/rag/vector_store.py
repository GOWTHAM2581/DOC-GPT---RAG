"""
Vector Store Module
FAISS-based vector database for similarity search
"""

import faiss
import numpy as np
from typing import List, Tuple
import os



import faiss
import numpy as np
from typing import List, Tuple, Dict
import os
import json
import uuid

class VectorStore:
    """
    Hybrid Vector Database:
    - Uses Supabase (pgvector) if credentials exist (Production)
    - Falls back to FAISS (local file) if not (Development)
    """
    
    def __init__(self, embedder):
        self.embedder = embedder
        self.dimension = embedder.embedding_dim
        self.supabase = None
        self.use_supabase = False
        
        # Check for Supabase credentials
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
        
        if supabase_url and supabase_key:
            try:
                from supabase import create_client
                self.supabase = create_client(supabase_url, supabase_key)
                self.use_supabase = True
                print("Using Supabase (pgvector) for vector storage")
            except Exception as e:
                print(f"Failed to initialize Supabase: {e}")
        
        # Initialize FAISS as fallback
        if not self.use_supabase:
            self.index = faiss.IndexFlatIP(self.dimension)
            self.chunks = [] # Keep chunks in memory for FAISS
            print("Using FAISS (local) for vector storage")

    def build_index(self, chunks: List[Dict]):
        """
        Index text chunks
        Args:
            chunks: List of dictionaries with 'text', 'page', etc.
        """
        texts = [c["text"] for c in chunks]
        embeddings = self.embedder.embed_texts(texts)
        
        if self.use_supabase:
            print(f"Uploading {len(chunks)} vectors to Supabase...")
            
            # Prepare data for Supabase
            rows = []
            for i, chunk in enumerate(chunks):
                rows.append({
                    "content": chunk["text"],
                    "metadata": chunk, # Store full chunk metadata
                    "embedding": embeddings[i].tolist()
                })
            
            # Batch insert to avoid limits
            batch_size = 50
            for i in range(0, len(rows), batch_size):
                batch = rows[i:i+batch_size]
                try:
                    self.supabase.table("documents").insert(batch).execute()
                    print(f"Uploaded batch {i//batch_size + 1}")
                except Exception as e:
                    print(f"Error inserting batch to Supabase: {e}")
                    # If table doesn't exist, we might fail here
                    raise e
                    
        else:
            # FAISS implementation
            self.index = faiss.IndexFlatIP(self.dimension)
            self.index.add(embeddings)
            self.chunks = chunks # Store chunks for retrieval
            print(f"FAISS index built with {self.index.ntotal} vectors")

    def search(self, query: str, top_k: int = 3) -> Tuple[List[float], List[int]]:
        """
        Search for most similar chunks
        Returns: (scores, indices_or_results)
        """
        query_embedding = self.embedder.embed_query(query)
        
        if self.use_supabase:
            # RPC call to 'match_documents' function in Supabase
            try:
                response = self.supabase.rpc(
                    "match_documents",
                    {
                        "query_embedding": query_embedding.tolist(),
                        "match_threshold": 0.5, # Minimum similarity
                        "match_count": top_k
                    }
                ).execute()
                
                # Format results to match expected output structure
                # Return direct list of chunks instead of indices
                results = response.data
                scores = [r.get('similarity', 0) for r in results]
                # For Supabase, we return the actual objects, so indices don't matter as much
                # But the calling code expects indices into a 'chunks' list.
                # We need to adapt the calling code in qa.py mostly.
                # Strategy: Return raw results and handle in QA?
                # Better: Return specific structure the QA expects.
                return scores, results 
                
            except Exception as e:
                print(f"Supabase search error: {e}")
                return [], []
                
        else:
            # FAISS Search
            query_embedding = query_embedding.reshape(1, -1)
            scores, indices = self.index.search(query_embedding, top_k)
            return scores[0].tolist(), indices[0].tolist()

    def save_index(self, path: str):
        if not self.use_supabase:
            faiss.write_index(self.index, path)
            print(f"Index saved to: {path}")

    def load_index(self, path: str):
        if not self.use_supabase:
            if os.path.exists(path):
                self.index = faiss.read_index(path)
                print(f"Index loaded from: {path}")
            else:
                print("Index file not found (FAISS)")
