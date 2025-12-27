"""
Embedding Generator Module
Creates vector embeddings using sentence transformers
"""

import os
# from sentence_transformers import SentenceTransformer # moved to inside class to prevent heavy load if using API
import numpy as np
from typing import List


class EmbeddingGenerator:
    """
    Generates embeddings using sentence-transformers
    
    Interview Note: Using 'all-MiniLM-L6-v2' for speed/quality balance.
    384-dimensional embeddings. Can upgrade to larger models for better quality.
    
    Alternative: OpenAI embeddings (better quality, requires API key)
    """
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize embedding model
        """
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        # Only use OpenAI if the key exists AND starts with 'sk-'
        if self.openai_api_key and self.openai_api_key.startswith("sk-"):
            from openai import OpenAI
            self.client = OpenAI(api_key=self.openai_api_key)
            self.use_openai = True
            self.embedding_dim = 1536  # Ada-002 dimension
            print("Using OpenAI embeddings (text-embedding-ada-002)")
        else:
            if self.openai_api_key and self.openai_api_key.startswith("gsk_"):
                print("Detected Groq key in OPENAI_API_KEY variable. Falling back to local embeddings.")
            
            print(f"Loading local embedding model: {model_name}")
            # Lazy import to save memory if using API
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer(model_name)
            self.embedding_dim = self.model.get_sentence_embedding_dimension()
            self.use_openai = False
            print(f"Model loaded - Dimension: {self.embedding_dim}")
    
    def embed_texts(self, texts: List[str]) -> np.ndarray:
        """Generate embeddings for multiple texts"""
        if not texts:
            raise ValueError("Cannot embed empty text list")
        
        if self.use_openai:
            print(f"Embedding {len(texts)} texts via OpenAI...")
            embeddings = []
            for text in texts:
                response = self.client.embeddings.create(input=text, model="text-embedding-ada-002")
                embeddings.append(response.data[0].embedding)
            return np.array(embeddings).astype('float32')
        
        print(f"Embedding {len(texts)} texts locally...")
        embeddings = self.model.encode(
            texts,
            show_progress_bar=True,
            convert_to_numpy=True,
            normalize_embeddings=True
        )
        return embeddings
    
    def embed_query(self, query: str) -> np.ndarray:
        """Generate embedding for a single query"""
        if not query or not query.strip():
            raise ValueError("Cannot embed empty query")
        
        if self.use_openai:
            response = self.client.embeddings.create(input=query, model="text-embedding-ada-002")
            return np.array(response.data[0].embedding).astype('float32')
        
        embedding = self.model.encode(
            query,
            convert_to_numpy=True,
            normalize_embeddings=True
        )
        return embedding
