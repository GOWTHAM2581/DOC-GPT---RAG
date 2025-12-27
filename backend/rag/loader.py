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
                        pages_text.append({
                            "page": page_num,
                            "text": text.strip()
                        })
                        print(f"  [OK] Page {page_num}/{total_pages} - {len(text)} chars")
                    else:
                        print(f"  [WARN] Page {page_num}/{total_pages} - No text found")
                
                print(f"Extracted text from {len(pages_text)} pages")
                
        except Exception as e:
            print(f"Error extracting PDF: {str(e)}")
            raise
        
        return pages_text
