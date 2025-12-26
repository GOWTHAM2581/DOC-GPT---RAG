📄 Retrieval-Augmented Generation (RAG)
Learning Notes & Implementation Overview
### Overview

Retrieval-Augmented Generation (RAG) is a system design pattern that combines:

• Information Retrieval (from user-provided documents)
• Text Generation (using Large Language Models)

Instead of relying only on a model’s pre-trained knowledge, RAG retrieves relevant information from external data sources (such as PDFs) and uses that data to generate accurate, grounded responses.

Key Note
RAG reduces hallucination by grounding responses in retrieved documents, but it does not completely eliminate hallucination.

### Why RAG Is Important
Limitations of Traditional LLMs

• Rely only on training data
• Cannot access private or user-specific documents
• May hallucinate when information is missing

Advantages of RAG Systems

• Use user-uploaded data
• Retrieve only relevant content
• Generate responses grounded in source documents
• Enable private, domain-specific Q&A

### High-Level Workflow

1. User uploads a document (PDF)
2. Document is split into chunks
3. Each chunk is converted into a vector (embedding)
4. Vectors are stored in a Vector Store
5. User asks a question
6. Question is converted into a vector
7. Vector similarity search retrieves Top-K relevant chunks
8. Retrieved chunks + question are sent to the LLM
9. LLM generates the final answer using retrieved context

### Document Chunking Strategy
Why Chunking Is Needed

LLMs have context limits. Large documents must be split to:

• Improve retrieval accuracy
• Preserve semantic meaning
• Optimize search performance

Common Chunk Configuration
Use Case	Chunk Size	Overlap
Academic papers	200–400 chars	50–80
News articles	400–600 chars	80–100
Manuals / Books	500–800 chars	100–150
Legal documents	800–1200 chars	150–200
Recommended Default
Chunk Size  : 500–800 characters
Chunk Overlap : 80–150 characters


Note
Overlap is not a percentage.
It is a fixed number of characters repeated between adjacent chunks to preserve context.

### Chunking Example (With Overlap)
Original Text
I am Gowtham, completed my B.E CSE at SNS College of Technology with a CGPA of 8.7.
During my course of study, I developed a strong foundation in Java and web development.

Chunk 1
I am Gowtham, completed my B.E CSE at SNS College of Technology

Chunk 2 (With Overlap)
B.E CSE at SNS College of Technology with a CGPA of 8.7

Chunk 3
CGPA of 8.7. During my course of study, I developed a strong foundation in Java

### Embeddings (Critical Concept)
What Is an Embedding?

An embedding is a numerical vector representation of text that captures semantic meaning.

• Similar meaning → vectors closer together
• Different meaning → vectors farther apart

Embedding Details

• Output: Array of floating-point numbers
• Common dimension: 1536

Example

[0.021, -0.334, 0.891, ...]


❌ Important Correction
Embedding dimension ≠ model parameters.
Model parameters are internal neural network weights.

### Vector Similarity Search

When a user asks a question:

1. Question is converted into an embedding
2. Similarity search is performed against stored vectors
3. Top-K most similar chunks are retrieved

Similarity Metrics

• Cosine Similarity (most common)
• Inner Product
• Euclidean Distance

Example

Query Vector ≈ [0.234]
Chunk Vector ≈ [0.231]
→ High similarity → Relevant chunk

### Top-K Retrieval

K defines how many relevant chunks are retrieved.

Typical Values

K = 3 or 5


• Higher K → more context, more noise
• Lower K → higher precision, possible missing context

Most systems:
• Retrieve Top-K chunks
• Pass them to the LLM
• Let the LLM synthesize the final answer

### Vector Storage Options
FAISS

• Local, file-based vector search
• Fast and lightweight
• Ideal for prototypes

Managed Vector Databases

• Pinecone
• Weaviate
• Qdrant

Feature	FAISS	Pinecone
Hosting	Local	Cloud
Cost	Free	Paid
Scalability	Limited	High
Setup	Simple	Managed
### PDF Processing & Persistence
PDF Extraction

• Library: pypdf
• Extracts raw text from uploaded PDFs

Persistence Using Pickle

pickle is used to:

• Serialize Python objects
• Save them to disk
• Reload without recomputation

import pickle

with open("vectors.pkl", "wb") as f:
    pickle.dump(vector_store, f)

### Minimal End-to-End RAG Code Example
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS

splitter = RecursiveCharacterTextSplitter(
    chunk_size=600,
    chunk_overlap=100
)

chunks = splitter.split_text(document_text)
embeddings = OpenAIEmbeddings()
vector_db = FAISS.from_texts(chunks, embeddings)

query = "What is Gowtham's educational background?"
docs = vector_db.similarity_search(query, k=3)

### Final Summary

• RAG combines retrieval + generation
• Documents are chunked and embedded
• Vectors enable semantic similarity search
• Retrieved chunks ground LLM responses
• FAISS enables fast local search
• Pickle enables persistence
• Chunk size depends on use case
