"""
Embedding Generator Module
Creates vector embeddings using sentence transformers
"""

import os
# from sentence_transformers import SentenceTransformer # Lazy import
import numpy as np
import requests
import time
from typing import List


class EmbeddingGenerator:
    """
    Generates embeddings.
    
    Modes (Priority):
    1. OpenAI (if OPENAI_API_KEY)
    2. HuggingFace API (if HUGGINGFACE_API_KEY) -> Best for free Render tier
    3. Local SentenceTransformer (fallback) -> Uses >500MB RAM, may crash free servers
    """
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.hf_api_key = os.getenv("HUGGINGFACE_API_KEY")
        
        self.mode = "local"
        self.client = None
        
        # 1. Try OpenAI
        if self.openai_api_key and self.openai_api_key.startswith("sk-") and not self.openai_api_key.startswith("sk-or-v1-"):
             # basic check to filter out placeholders if any
            from openai import OpenAI
            self.client = OpenAI(api_key=self.openai_api_key)
            self.mode = "openai"
            self.embedding_dim = 1536
            print("Using OpenAI embeddings (text-embedding-ada-002)")
            
        # 2. Try HuggingFace API (Lightweight, Free)
        elif self.hf_api_key:
            self.mode = "huggingface"
            # Reverting to standard API URL (router requires special PRO subscription sometimes)
            self.api_url = f"https://api-inference.huggingface.co/models/{model_name}" 
            self.headers = {"Authorization": f"Bearer {self.hf_api_key}"}
            self.embedding_dim = 384
            print(f"Using HuggingFace Inference API for {model_name}")
            
        # 3. Fallback to Local (Heavy)
        else:
            print(f"Loading local embedding model: {model_name}")
            print("WARN: This uses significant RAM and may crash on free hosting tiers.")
            # Lazy import to save memory if using API
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer(model_name)
            self.mode = "local"
            self.embedding_dim = self.model.get_sentence_embedding_dimension()
            print(f"Model loaded - Dimension: {self.embedding_dim}")
    
    def embed_texts(self, texts: List[str]) -> np.ndarray:
        """Generate embeddings for multiple texts"""
        if not texts:
            raise ValueError("Cannot embed empty text list")
        
        # OPENAI
        if self.mode == "openai":
            print(f"Embedding {len(texts)} texts via OpenAI...")
            embeddings = []
            for text in texts:
                # OpenAI handles newlines poorly in embeddings sometimes
                text = text.replace("\n", " ")
                response = self.client.embeddings.create(input=text, model="text-embedding-ada-002")
                embeddings.append(response.data[0].embedding)
            return np.array(embeddings).astype('float32')
            
        # HUGGINGFACE API
        elif self.mode == "huggingface":
            print(f"Embedding {len(texts)} texts via HuggingFace API...")
            response = requests.post(self.api_url, headers=self.headers, json={"inputs": texts, "options": {"wait_for_model": True}})
            
            if response.status_code != 200:
                print(f"HF API Error: {response.text}")
                raise Exception(f"HuggingFace API failed: {response.text}")
                
            embeddings = response.json()
            # Handle potential API errors returned as JSON
            if isinstance(embeddings, dict) and "error" in embeddings:
                 raise Exception(f"HF API Error: {embeddings['error']}")
                 
            return np.array(embeddings).astype('float32')
        
        # LOCAL
        else:
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
        # Wrap single query in list and take first result
        # This unifies the logic and works for all providers
        embeddings = self.embed_texts([query])
        return embeddings[0]
