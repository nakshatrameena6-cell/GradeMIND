"""
GradeMIND Submission Pydantic Schemas.
Request/response validation models for the Submission API endpoints.
"""

from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class SubmissionCreate(BaseModel):
    """Schema for creating a new submission. File is uploaded separately via multipart form."""
    exam_id: UUID
    student_name: str = Field(..., min_length=1, max_length=200, description="Full name of the student.")
    student_roll_number: str = Field(..., min_length=1, max_length=50, description="Student roll/ID number.")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "exam_id": "123e4567-e89b-12d3-a456-426614174000",
                "student_name": "Aarav Sharma",
                "student_roll_number": "CS2024001"
            }
        }
    )


class SubmissionResponse(BaseModel):
    """Full submission detail response."""
    id: UUID
    exam_id: UUID
    student_name: str
    student_roll_number: str
    answer_sheet_path: Optional[str] = None
    ocr_output_path: Optional[str] = None
    evaluation_output_path: Optional[str] = None
    report_path: Optional[str] = None
    status: str
    ocr_status: Optional[str] = None
    evaluation_status: Optional[str] = None
    obtained_marks: Optional[float] = None
    total_marks: Optional[float] = None
    ocr_confidence: Optional[float] = None
    evaluation_confidence: Optional[float] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                "exam_id": "123e4567-e89b-12d3-a456-426614174000",
                "student_name": "Aarav Sharma",
                "student_roll_number": "CS2024001",
                "answer_sheet_path": "storage/answer_sheets/123e4567/CS2024001.pdf",
                "status": "UPLOADED",
                "ocr_status": None,
                "evaluation_status": None,
                "obtained_marks": None,
                "total_marks": None,
                "ocr_confidence": None,
                "evaluation_confidence": None,
                "created_at": "2026-06-13T12:00:00Z",
                "updated_at": "2026-06-13T12:00:00Z"
            }
        }
    )


class SubmissionListResponse(BaseModel):
    """Paginated list of submissions."""
    submissions: List[SubmissionResponse]
    total: int

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "submissions": [
                    {
                        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                        "exam_id": "123e4567-e89b-12d3-a456-426614174000",
                        "student_name": "Aarav Sharma",
                        "student_roll_number": "CS2024001",
                        "status": "COMPLETED",
                        "obtained_marks": 85.0,
                        "total_marks": 100.0,
                        "created_at": "2026-06-13T12:00:00Z",
                        "updated_at": "2026-06-13T12:30:00Z"
                    }
                ],
                "total": 1
            }
        }
    )


class SubmissionStatusResponse(BaseModel):
    """Lightweight status check response for polling."""
    id: UUID
    status: str
    ocr_status: Optional[str] = None
    evaluation_status: Optional[str] = None
    obtained_marks: Optional[float] = None
    total_marks: Optional[float] = None
    ocr_confidence: Optional[float] = None
    evaluation_confidence: Optional[float] = None
    error_message: Optional[str] = None

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                "status": "OCR_COMPLETE",
                "ocr_status": "COMPLETED",
                "evaluation_status": None,
                "obtained_marks": None,
                "total_marks": None,
                "ocr_confidence": 0.94,
                "evaluation_confidence": None,
                "error_message": None
            }
        }
    )
