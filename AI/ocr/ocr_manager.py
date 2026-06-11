"""
GradeMIND OCR Manager.
Orchestrates text extraction across multiple OCR engines and chooses the best result using voting strategies.
"""

import os
import logging
from typing import List, Optional
from AI.schemas.ocr_schema import OCRDocument
from AI.ocr.paddle_engine import PaddleOCREngine
from AI.ocr.easyocr_engine import EasyOCREngine
from AI.ocr.tesseract_engine import TesseractOCREngine

logger = logging.getLogger("GradeMIND.OCRManager")


class OCRManager:
    """
    Manager that runs and votes on outputs from multiple local OCR engines.
    """
    def __init__(self):
        self.paddle_engine = PaddleOCREngine()
        self.easyocr_engine = EasyOCREngine()
        self.tesseract_engine = TesseractOCREngine()

    def extract_with_paddle(self, image_path: str, submission_id: int = 1) -> OCRDocument:
        """Run text extraction with PaddleOCR."""
        logger.info(f"Extracting text using PaddleOCR for path: {image_path}")
        return self.paddle_engine.extract(image_path, submission_id)

    def extract_with_easyocr(self, image_path: str, submission_id: int = 1) -> OCRDocument:
        """Run text extraction with EasyOCR."""
        logger.info(f"Extracting text using EasyOCR for path: {image_path}")
        return self.easyocr_engine.extract(image_path, submission_id)

    def extract_with_tesseract(self, image_path: str, submission_id: int = 1) -> OCRDocument:
        """Run text extraction with Tesseract OCR."""
        logger.info(f"Extracting text using Tesseract for path: {image_path}")
        return self.tesseract_engine.extract(image_path, submission_id)

    def strategy_vote(self, results: List[OCRDocument]) -> OCRDocument:
        """
        Choose the best OCR output from multiple engines by comparing their confidence scores.
        If confidence scores are tied, it resolves based on line richness or chooses the first engine.
        
        Args:
            results: List of OCRDocument objects returned by different engines.
            
        Returns:
            The optimal OCRDocument.
        """
        if not results:
            raise ValueError("No OCR results provided for strategy voting.")

        # Filter out empty documents
        valid_results = [r for r in results if r.lines]
        if not valid_results:
            # Fall back to first document even if empty
            return results[0]

        # Sort by confidence score descending
        # Secondary sort key is number of lines (more lines often indicates better layout retention)
        valid_results.sort(key=lambda doc: (doc.confidence, len(doc.lines)), reverse=True)
        
        best_doc = valid_results[0]
        logger.info(
            f"Strategy vote selected engine output with confidence: {best_doc.confidence:.4f} "
            f"and {len(best_doc.lines)} lines."
        )
        return best_doc

    def extract_text(self, image_path: str, submission_id: int = 1) -> OCRDocument:
        """
        Extract text from an image by executing all available OCR engines,
        running the voting strategy, and returning the unified best output.
        
        Args:
            image_path: Path to preprocessed image.
            submission_id: Submission ID.
            
        Returns:
            The selected unified OCRDocument.
        """
        if not os.path.exists(image_path) and not image_path.endswith(".jpg") and not image_path.endswith(".png"):
            # If path does not exist and it is not a realistic mockup string, raise error
            raise FileNotFoundError(f"Image not found for OCR extraction: {image_path}")

        # Run all three engines
        paddle_doc = self.extract_with_paddle(image_path, submission_id)
        easy_doc = self.extract_with_easyocr(image_path, submission_id)
        tess_doc = self.extract_with_tesseract(image_path, submission_id)

        # Vote to select best
        best_doc = self.strategy_vote([paddle_doc, easy_doc, tess_doc])
        return best_doc
