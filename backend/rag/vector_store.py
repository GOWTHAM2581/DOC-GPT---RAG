"""
Vector Store Module
Production-ready Pinecone storage with multi-tenancy support (Namespaces)
"""

import os
import json
import uuid
import numpy as np
from pinecone import Pinecone
from typing import List, Tuple, Dict

class VectorStore:
    """
    Hybrid Vector Database:
    - Uses Pinecone as primary storage
    - Supports multi-tenancy (Namespaces architecture)
    """
    
    def __init__(self, embedder):
        self.embedder = embedder
        self.dimension = embedder.embedding_dim
        self.use_pinecone = False
        self.index = None
        
        # Pinecone Connection Details
        self.api_key = os.getenv("PINECONE_API_KEY")
        self.index_name = os.getenv("PINECONE_INDEX_NAME")
        
        if self.api_key and self.index_name:
            try:
                self._init_pinecone()
                self.use_pinecone = True
                print(f"✅ Successfully connected to Pinecone: {self.index_name}")
            except Exception as e:
                print(f"❌ Failed to connect to Pinecone: {e}")
                print("⚠️ Vector storage is unavailable.")
        else:
            print("⚠️ Pinecone credentials missing in environment variables.")

    def _init_pinecone(self):
        """Initialize Pinecone client and index"""
        pc = Pinecone(api_key=self.api_key)
        self.index = pc.Index(self.index_name)

    def build_index(self, chunks: List[Dict], tenant_id: str = "default"):
        """
        Index text chunks into Pinecone using Namespaces
        """
        if not self.use_pinecone:
            print("⚠️ Pinecone not available. Cannot index.")
            return

        texts = [c["text"] for c in chunks]
        embeddings = self.embedder.embed_texts(texts)
        
        print(f"🚀 Uploading {len(chunks)} vectors to Pinecone [{self.index_name}] in namespace [{tenant_id}]...")
        
        vectors = []
        for i, chunk in enumerate(chunks):
            # Clean metadata to avoid type errors in Pinecone (only allows str, int, float, bool, list of str)
            clean_metadata = {
                "text": chunk["text"],
                "document_name": str(chunk.get("document_name", "unknown")),
                "page": int(chunk.get("page", 0))
            }
            
            # Merge additional metadata if present
            if "metadata" in chunk and isinstance(chunk["metadata"], dict):
                for k, v in chunk["metadata"].items():
                    if isinstance(v, (str, int, float, bool)):
                        clean_metadata[k] = v
                    elif isinstance(v, list) and all(isinstance(x, str) for x in v):
                        clean_metadata[k] = v
            
            vectors.append({
                "id": f"{tenant_id}_{uuid.uuid4()}",
                "values": embeddings[i].tolist(),
                "metadata": clean_metadata
            })
            
        # Pinecone upsert in batches of 100 to avoid request size limits
        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i + batch_size]
            self.index.upsert(vectors=batch, namespace=tenant_id)
            
        print(f"✅ Successfully indexed {len(chunks)} chunks in Pinecone")

    def search(self, query: str, top_k: int = 3, tenant_id: str = "default") -> Tuple[List[float], List[Dict]]:
        """
        Search for most similar chunks using Cosine Similarity within a namespace
        Returns: (scores, results)
        """
        if not self.use_pinecone:
            print("⚠️ Pinecone not available. Search failed.")
            return [], []

        query_embedding = self.embedder.embed_query(query)
        
        # Pinecone query
        query_response = self.index.query(
            vector=query_embedding.tolist(),
            top_k=top_k,
            include_metadata=True,
            namespace=tenant_id
        )
            
        results = []
        scores = []
        for match in query_response["matches"]:
            metadata = match["metadata"]
            results.append({
                "text": metadata.get("text", ""),
                "page": metadata.get("page", 0),
                "metadata": metadata
            })
            scores.append(float(match["score"]))
            
        return scores, results

    def save_index(self, path: str):
        pass

    def load_index(self, path: str):
        pass
