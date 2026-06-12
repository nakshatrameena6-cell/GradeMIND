import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

class Exam(Base):
    __tablename__ = "exams"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Temporary teacher_id without a foreign key since users table is not yet finalized
    teacher_id = Column(UUID(as_uuid=True), nullable=False)
    title = Column(String(200), nullable=False)
    subject = Column(String(100), nullable=False)
    total_marks = Column(Integer, nullable=False)
    question_paper_url = Column(String, nullable=True)
    answer_key_url = Column(String, nullable=True)
    status = Column(String, nullable=False, default="PENDING")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
