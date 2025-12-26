"""
Vector Store Module
FAISS-based vector database for similarity search
"""

import faiss
import numpy as np
from typing import List, Tuple
import os


class VectorStore:
    """
    FAISS vector database for efficient similarity search
    
    Interview Note: Using FAISS IndexFlatIP (Inner Product) for exact search.
    With normalized embeddings, inner product = cosine similarity.
    Could upgrade to IndexIVFFlat for larger datasets (approximate search).
    """
    
    def __init__(self, embedder):
        """
        Initialize vector store
        
        Args:
            embedder: EmbeddingGenerator instance
        """
        self.embedder = embedder
        self.index = None
        self.dimension = embedder.embedding_dim
    
    def build_index(self, texts: List[str]):
        """
        Build FAISS index from texts
        
        Args:
            texts: List of text chunks to index
        """
        if not texts:
            raise ValueError("Cannot build index from empty text list")
        
        # Generate embeddings
        embeddings = self.embedder.embed_texts(texts)
        
        # Create FAISS index
        # Using IndexFlatIP for exact cosine similarity (with normalized embeddings)
        self.index = faiss.IndexFlatIP(self.dimension)
        
        # Add vectors to index
        self.index.add(embeddings)
        
        print(f"✅ FAISS index built with {self.index.ntotal} vectors")
    
    def search(self, query: str, top_k: int = 3) -> Tuple[List[float], List[int]]:
        """
        Search for most similar chunks
        
        Args:
            query: Query text
            top_k: Number of results to return
            
        Returns:
            Tuple of (similarity_scores, chunk_indices)
            
        Interview Note: Returns cosine similarity scores (0-1 range).
        Higher score = more similar.
        """
        if self.index is None:
            raise ValueError("Index not built. Call build_index() first.")
        
        # Embed query
        query_embedding = self.embedder.embed_query(query)
        
        # Reshape for FAISS (expects 2D array)
        query_embedding = query_embedding.reshape(1, -1)
        
        # Search
        scores, indices = self.index.search(query_embedding, top_k)
        
        # Convert to lists and flatten
        scores = scores[0].tolist()
        indices = indices[0].tolist()
        
        return scores, indices
    
    def save_index(self, path: str):
        """
        Save FAISS index to disk
        
        Args:
            path: File path to save index
        """
        if self.index is None:
            raise ValueError("No index to save")
        
        faiss.write_index(self.index, path)
        print(f"💾 Index saved to: {path}")
    
    def load_index(self, path: str):
        """
        Load FAISS index from disk
        
        Args:
            path: File path to load index from
        """
        if not os.path.exists(path):
            raise FileNotFoundError(f"Index file not found: {path}")
        
        self.index = faiss.read_index(path)
        print(f"📂 Index loaded from: {path} ({self.index.ntotal} vectors)")
