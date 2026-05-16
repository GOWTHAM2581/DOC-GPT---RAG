"""
PDF Loader Module
Extracts text from PDF documents page-wise
"""

import PyPDF2
from typing import List, Dict


class PDFLoader:
    """
    Loads and extracts text from PDF files
    
    Interview Note: Using PyPDF2 for reliable text extraction.
    Could upgrade to pdfplumber for better table/image handling.
    """
    
    def extract_text(self, pdf_path: str) -> List[Dict[str, any]]:
        """
        Extract text from PDF, page by page
        
        Args:
            pdf_path: Path to PDF file
            
        Returns:
            List of dicts with page number and text
            
        Example:
            [
                {"page": 1, "text": "Page 1 content..."},
                {"page": 2, "text": "Page 2 content..."}
            ]
        """
        pages_text = []
        
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                total_pages = len(pdf_reader.pages)
                
                print(f"Processing PDF with {total_pages} pages...")
                
                for page_num, page in enumerate(pdf_reader.pages, start=1):
                    text = page.extract_text()
                    
                    # Only include pages with actual text
                    if text and text.strip():
                        # Basic cleaning: Remove repeated newlines and normalize spaces
                        # This helps with "broken words" often caused by PDF double-spacing or layout issues
                        clean_text = text.replace('\n', ' ').replace('\r', '').replace('  ', ' ')
                        clean_text = ' '.join(clean_text.split())
                        
                        pages_text.append({
                            "page": page_num,
                            "text": clean_text
                        })
                        print(f"  [OK] Page {page_num}/{total_pages} - {len(text)} chars")
                    else:
                        print(f"  [WARN] Page {page_num}/{total_pages} - No text found")
                
                print(f"Extracted text from {len(pages_text)} pages")
                
        except Exception as e:
            print(f"Error extracting PDF: {str(e)}")
            raise
        
        return pages_text


class CSVLoader:
    """
    Loads and extracts text from CSV files (Product data, etc.)
    """
    
    def extract_csv(self, csv_path: str) -> List[Dict[str, any]]:
        """
        Extract text from CSV, row by row
        """
        import csv
        chunks = []
        
        try:
            with open(csv_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for i, row in enumerate(reader, start=1):
                    # Convert row dictionary to a descriptive string for better RAG context
                    # Format: Key1: Value1, Key2: Value2...
                    text_parts = [f"{key}: {value}" for key, value in row.items() if value]
                    text = " | ".join(text_parts)
                    
                    if text.strip():
                        chunks.append({
                            "page": i, # Treat row number as "page" for compatibility
                            "text": text,
                            "metadata": row # Store original row data in metadata
                        })
                
                print(f"Extracted {len(chunks)} rows from CSV")
                
        except Exception as e:
            print(f"Error extracting CSV: {str(e)}")
            raise
            
        return chunks
