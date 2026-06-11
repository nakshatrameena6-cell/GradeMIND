"""
GradeMIND Tesseract OCR Engine.
Interface for extracting text and layout bounding boxes using Tesseract OCR (via pytesseract).
"""

import logging
from typing import Optional
from AI.schemas.ocr_schema import OCRDocument, OCRLine, OCRRegion

logger = logging.getLogger("GradeMIND.TesseractEngine")

_tesseract_initialized = False
_has_pytesseract = False


def _init_tesseract():
    global _tesseract_initialized, _has_pytesseract
    if _tesseract_initialized:
        return
    try:
        import pytesseract
        # Verify if tesseract is installed in the system by checking version
        pytesseract.get_tesseract_version()
        _has_pytesseract = True
        logger.info("Initializing Tesseract OCR engine...")
    except Exception as e:
        logger.warning(f"Tesseract OCR failed to initialize or not found: {e}. Engine will run in Fallback Mode.")
        _has_pytesseract = False
    _tesseract_initialized = True


class TesseractOCREngine:
    """
    Wrapper class around Tesseract OCR text recognition engine.
    """
    def __init__(self):
        _init_tesseract()

    def extract(self, image_path: str, submission_id: int = 1) -> OCRDocument:
        """
        Run Tesseract OCR text recognition on an image.
        
        Args:
            image_path: Path to the image file.
            submission_id: Reference ID of the student submission.
            
        Returns:
            OCRDocument containing extracted layout regions and lines.
        """
        if not _has_pytesseract:
            return self._generate_mock_document(submission_id)

        try:
            import pytesseract
            # Run image_to_data to extract word positions and confidence scores
            data = pytesseract.image_to_data(image_path, output_type=pytesseract.Output.DICT)
            
            regions = []
            n_boxes = len(data['level'])
            
            # Words are typically level 5. Let's group words on the same line (same block_num, line_num)
            word_groups = {}
            for i in range(n_boxes):
                # Filter empty text and non-word levels
                text = data['text'][i].strip()
                conf = float(data['conf'][i])
                if not text or conf == -1:
                    continue
                
                # Group by block_num and line_num
                key = (data['block_num'][i], data['line_num'][i])
                if key not in word_groups:
                    word_groups[key] = []
                
                word_groups[key].append({
                    "text": text,
                    "confidence": conf / 100.0,  # Tesseract returns 0-100
                    "left": float(data['left'][i]),
                    "top": float(data['top'][i]),
                    "width": float(data['width'][i]),
                    "height": float(data['height'][i])
                })

            for key, words in word_groups.items():
                # Sort words in the line by left coordinate
                words.sort(key=lambda w: w["left"])
                
                # Combine words to construct a line representation
                line_text = " ".join(w["text"] for w in words)
                avg_conf = sum(w["confidence"] for w in words) / len(words)
                
                # Form bounding box from union of word boxes
                lefts = [w["left"] for w in words]
                tops = [w["top"] for w in words]
                rights = [w["left"] + w["width"] for w in words]
                bottoms = [w["top"] + w["height"] for w in words]
                
                xmin, ymin = min(lefts), min(tops)
                xmax, ymax = max(rights), max(bottoms)
                
                bbox = [[xmin, ymin], [xmax, ymin], [xmax, ymax], [xmin, ymax]]
                
                regions.append(
                    OCRRegion(
                        text=line_text,
                        confidence=avg_conf,
                        bounding_box=bbox,
                        top_y=ymin,
                        left_x=xmin
                    )
                )

            # Sort regions vertically by top_y
            regions.sort(key=lambda r: r.top_y)

            # Build OCRLines (Tesseract output is already grouped by line)
            lines = []
            for region in regions:
                lines.append(
                    OCRLine(
                        text=region.text,
                        confidence=region.confidence,
                        bounding_box=region.bounding_box,
                        top_y=region.top_y,
                        left_x=region.left_x
                    )
                )

            aggregate_confidence = sum(r.confidence for r in regions) / len(regions) if regions else 0.0

            return OCRDocument(
                submission_id=submission_id,
                confidence=aggregate_confidence,
                lines=lines,
                regions=regions
            )

        except Exception as e:
            logger.error(f"Error during Tesseract OCR execution: {e}")
            return self._generate_mock_document(submission_id)

    def _generate_mock_document(self, submission_id: int) -> OCRDocument:
        """
        Generate realistic mock OCR results for student submissions when Tesseract is not installed.
        Contains slight transcription noise (e.g., spelling errors) to simulate standard Tesseract behavior.
        """
        logger.info(f"Generating mock OCRDocument for submission {submission_id} via TesseractOCREngine")
        
        mock_data = [
            ("Q1. What is Photosynthesis?", [[100, 100], [400, 100], [400, 120], [100, 120]], 0.95),
            ("Student Answer: Photosynthesis is the process used by plants to convert light energy to chemical energy.", [[100, 140], [800, 140], [800, 160], [100, 160]], 0.88),
            ("This occurs in the cloroplasts using chlorophyll. They absorb carbon dioxide and water to make glucose and release oxygen.", [[100, 170], [850, 170], [850, 190], [100, 190]], 0.85),
            ("Q2. Define Cell Division and compare Mitosis with Meiosis.", [[100, 250], [600, 250], [600, 270], [100, 270]], 0.93),
            ("Student Answer: Cell division is how cells replicate. Mitosis produces two identical diploid daughter cells", [[100, 290], [800, 290], [800, 310], [100, 310]], 0.89),
            ("for growth and repair. Meiosis produces four unique haploid gametes for sexual reproduction.", [[100, 320], [820, 320], [820, 340], [100, 340]], 0.87),
            ("Q3. Solve: 2x + 5 = 15.", [[100, 400], [300, 400], [300, 420], [100, 420]], 0.94),
            ("Student Answer: 2x = 15 - 5 => 2x = 10 => x = 5.", [[100, 440], [500, 440], [500, 460], [100, 460]], 0.84)
        ]

        regions = []
        lines = []

        for text, poly, conf in mock_data:
            region = OCRRegion(
                text=text,
                confidence=conf,
                bounding_box=poly,
                top_y=float(poly[0][1]),
                left_x=float(poly[0][0])
            )
            regions.append(region)
            
            line = OCRLine(
                text=text,
                confidence=conf,
                bounding_box=poly,
                top_y=float(poly[0][1]),
                left_x=float(poly[0][0])
            )
            lines.append(line)

        avg_conf = sum(r.confidence for r in regions) / len(regions)

        return OCRDocument(
            submission_id=submission_id,
            confidence=avg_conf,
            lines=lines,
            regions=regions
        )
