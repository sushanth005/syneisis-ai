"""
Document Processor Service
Handles text extraction from PDF, DOCX, and image files using OCR.
"""

import re
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


class DocumentProcessor:
    """Extract and clean text from various document formats."""

    def extract_text(self, file_path: str, content_type: str) -> str:
        """Route to appropriate extractor based on file type."""
        ext = Path(file_path).suffix.lower()
        logger.info(f"Extracting text from {file_path} (ext={ext}, type={content_type})")

        try:
            if ext == ".pdf" or "pdf" in content_type:
                text = self._extract_pdf(file_path)
            elif ext in (".docx", ".doc") or "word" in content_type or "msword" in content_type:
                text = self._extract_docx(file_path)
            elif ext in (".png", ".jpg", ".jpeg", ".tiff", ".bmp") or content_type.startswith("image/"):
                text = self._extract_image_ocr(file_path)
            else:
                # Try PDF as default
                text = self._extract_pdf(file_path)

            return self._clean_text(text)

        except Exception as e:
            logger.exception(f"Text extraction error: {e}")
            raise ValueError(f"Failed to extract text from document: {str(e)}")

    def _extract_pdf(self, file_path: str) -> str:
        """Extract text from PDF using pdfplumber with PyMuPDF fallback."""
        text = ""

        # Try pdfplumber first
        try:
            import pdfplumber
            with pdfplumber.open(file_path) as pdf:
                pages_text = []
                for i, page in enumerate(pdf.pages):
                    page_text = page.extract_text() or ""
                    pages_text.append(f"[Page {i+1}]\n{page_text}")
                text = "\n\n".join(pages_text)
            logger.info(f"pdfplumber extracted {len(text)} chars")
        except Exception as e:
            logger.warning(f"pdfplumber failed: {e}")

        # If pdfplumber got very little, try PyMuPDF
        if len(text.strip()) < 100:
            try:
                import fitz  # PyMuPDF
                doc = fitz.open(file_path)
                pages_text = []
                for i, page in enumerate(doc):
                    page_text = page.get_text("text")
                    pages_text.append(f"[Page {i+1}]\n{page_text}")
                doc.close()
                text = "\n\n".join(pages_text)
                logger.info(f"PyMuPDF extracted {len(text)} chars")
            except Exception as e:
                logger.warning(f"PyMuPDF failed: {e}")

        # If still minimal text, it's likely a scanned PDF — try OCR
        if len(text.strip()) < 100:
            logger.info("PDF appears to be scanned. Attempting OCR...")
            text = self._ocr_pdf(file_path)

        return text

    def _ocr_pdf(self, file_path: str) -> str:
        """OCR a scanned PDF by converting pages to images."""
        text_parts = []
        try:
            import fitz
            doc = fitz.open(file_path)
            for i, page in enumerate(doc):
                # Render at 300 DPI
                mat = fitz.Matrix(300 / 72, 300 / 72)
                pix = page.get_pixmap(matrix=mat)
                img_data = pix.tobytes("png")

                from PIL import Image
                import io
                img = Image.open(io.BytesIO(img_data))
                page_text = self._ocr_image(img)
                text_parts.append(f"[Page {i+1}]\n{page_text}")
            doc.close()
        except Exception as e:
            logger.warning(f"PDF OCR failed: {e}")

        return "\n\n".join(text_parts)

    def _extract_docx(self, file_path: str) -> str:
        """Extract text from DOCX files."""
        try:
            from docx import Document
            doc = Document(file_path)
            paragraphs = []
            for para in doc.paragraphs:
                if para.text.strip():
                    # Preserve heading style info
                    prefix = ""
                    if para.style.name.startswith("Heading"):
                        level = para.style.name.replace("Heading ", "")
                        prefix = "#" * int(level) + " " if level.isdigit() else "## "
                    paragraphs.append(f"{prefix}{para.text}")

            # Also extract tables
            for table in doc.tables:
                for row in table.rows:
                    row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                    if row_text:
                        paragraphs.append(row_text)

            return "\n\n".join(paragraphs)
        except Exception as e:
            logger.exception(f"DOCX extraction failed: {e}")
            raise

    def _extract_image_ocr(self, file_path: str) -> str:
        """OCR a single image file."""
        try:
            from PIL import Image
            img = Image.open(file_path)
            return self._ocr_image(img)
        except Exception as e:
            logger.exception(f"Image OCR failed: {e}")
            raise

    def _ocr_image(self, img) -> str:
        """Apply OCR to a PIL Image object."""
        # Preprocess: convert to grayscale, resize if too small
        try:
            from PIL import ImageEnhance, ImageFilter
            import io

            # Convert to grayscale for better OCR
            if img.mode != "L":
                img = img.convert("L")

            # Enhance contrast
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(2.0)

            # Sharpen
            img = img.filter(ImageFilter.SHARPEN)

        except Exception:
            pass

        # Try pytesseract first
        try:
            import pytesseract
            text = pytesseract.image_to_string(img, config="--psm 6")
            if text.strip():
                logger.info(f"Tesseract extracted {len(text)} chars")
                return text
        except Exception as e:
            logger.warning(f"Tesseract failed: {e}")

        # Fallback: EasyOCR
        try:
            import easyocr
            import numpy as np
            reader = easyocr.Reader(["en"], gpu=False)
            result = reader.readtext(np.array(img), detail=0)
            text = " ".join(result)
            logger.info(f"EasyOCR extracted {len(text)} chars")
            return text
        except Exception as e:
            logger.warning(f"EasyOCR failed: {e}")

        raise ValueError("OCR failed with both Tesseract and EasyOCR. Please upload a cleaner image.")

    def _clean_text(self, text: str) -> str:
        """Clean and normalize extracted text."""
        if not text:
            return ""

        # Remove excessive whitespace but preserve paragraph breaks
        text = re.sub(r"\r\n", "\n", text)
        text = re.sub(r"\r", "\n", text)
        text = re.sub(r"[ \t]+", " ", text)          # Collapse horizontal whitespace
        text = re.sub(r"\n{4,}", "\n\n\n", text)     # Limit blank lines to 2
        text = re.sub(r"[^\S\n]+$", "", text, flags=re.MULTILINE)  # Trailing spaces

        return text.strip()
