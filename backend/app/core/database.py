from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# In SQLAlchemy 2.0, declarative_base() is still standard,
# or we can use the newer class Base(DeclarativeBase): pass.
# Let's use the declarative_base() which is fully compatible with standard patterns,
# or the class-based DeclarativeBase. Let's use the DeclarativeBase subclass.
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

# Create the engine. We echo SQL queries if in DEBUG mode.
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True  # Detect and recover from stale connections
)

# Create SessionLocal class for database sessions
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

def init_db() -> None:
    """
    Initialize database schemas.
    Note: In production and standard workflows, Alembic is preferred.
    This function is a fallback for quick initialization.
    """
    from app.models.user import User  # noqa: F401
    Base.metadata.create_all(bind=engine)
