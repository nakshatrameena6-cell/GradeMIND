from typing import Generator
from app.core.database import SessionLocal


def get_db() -> Generator:
    """
    Dependency generator for database sessions.
    Yields a session and ensures it is closed after the request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
