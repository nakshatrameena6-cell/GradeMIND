from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.models.audit_log import AuditLog
from typing import Optional
from uuid import UUID
import logging

logger = logging.getLogger(__name__)

class AuditService:
    @staticmethod
    def log_event(
        db: Session,
        action: str,
        user_id: Optional[UUID] = None,
        ip_address: Optional[str] = None
    ) -> None:
        """
        Record a security or audit event.
        """
        try:
            log_entry = AuditLog(
                action=action,
                user_id=user_id,
                ip_address=ip_address
            )
            db.add(log_entry)
            db.commit()
            logger.info(f"Audit event '{action}' logged successfully for user {user_id}")
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Failed to log audit event '{action}' for user {user_id}: {str(e)}")
