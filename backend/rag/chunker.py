"""
Text Chunker Module
Splits text into overlapping chunks for better retrieval
"""

from typing import List, Dict


class TextChunker:
    """
    Chunks text with configurable size and overlap
    
    Interview Note: Overlap prevents context loss at chunk boundaries.
    Chunk size of 500 balances context richness and retrieval precision.
    """
    
    def __init__(self, chunk_size: int = 500, overlap: int = 100):
        """
        Initialize chunker
        
        Args:
            chunk_size: Number of characters per chunk
            overlap: Number of overlapping characters between chunks
        """
        self.chunk_size = chunk_size
        self.overlap = overlap
        
        if overlap >= chunk_size:
            raise ValueError("Overlap must be less than chunk_size")
    
    def create_chunks(self, pages_text: List[Dict[str, any]]) -> List[Dict[str, any]]:
        """
        Create overlapping chunks from pages
        
        Args:
            pages_text: List of page dictionaries with 'page' and 'text'
            
        Returns:
            List of chunk dictionaries with text, page, and chunk_id
            
        Example Output:
            [
                {
                    "chunk_id": 0,
                    "text": "First chunk...",
                    "page": 1,
                    "char_start": 0,
                    "char_end": 500
                },
                ...
            ]
        """
        all_chunks = []
        chunk_id = 0
        
        for page_data in pages_text:
            page_num = page_data["page"]
            page_text = page_data["text"]
            
            # Split page into chunks with overlap
            page_chunks = self._chunk_text(page_text, page_num, chunk_id)
            all_chunks.extend(page_chunks)
            chunk_id += len(page_chunks)
        
        print(f"✂️ Created {len(all_chunks)} chunks from {len(pages_text)} pages")
        return all_chunks
    
    def _chunk_text(self, text: str, page_num: int, start_chunk_id: int) -> List[Dict[str, any]]:
        """
        Chunk a single text with overlap
        
        Args:
            text: Text to chunk
            page_num: Page number for metadata
            start_chunk_id: Starting chunk ID
            
        Returns:
            List of chunk dictionaries
        """
        chunks = []
        text_len = len(text)
        
        # Start position for each chunk
        start = 0
        chunk_id = start_chunk_id
        
        while start < text_len:
            # Calculate end position
            end = min(start + self.chunk_size, text_len)
            
            # Extract chunk
            chunk_text = text[start:end].strip()
            
            # Only add non-empty chunks
            if chunk_text:
                chunks.append({
                    "chunk_id": chunk_id,
                    "text": chunk_text,
                    "page": page_num,
                    "char_start": start,
                    "char_end": end,
                    "chunk_size": len(chunk_text)
                })
                chunk_id += 1
            
            # Move to next chunk with overlap
            # If we're at the end, break to avoid infinite loop
            if end == text_len:
                break
            
            start = end - self.overlap
        
        return chunks
