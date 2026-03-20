"""
Database engine and session management.

Connects to Supabase PostgreSQL using the DATABASE_URL from config.
Provides a session dependency for FastAPI routes and a health check
function for startup validation.
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from typing import Generator

from config import DATABASE_URL

# SQLAlchemy engine — pool_pre_ping keeps connections alive across
# Supabase's idle timeout, so we don't hit stale connection errors.
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

# Session factory — each request gets its own session via get_db()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all ORM models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that provides a database session.

    Opens a session at the start of the request and closes it
    when the request finishes, regardless of success or failure.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> bool:
    """Verify the database is reachable.

    Called during startup — if this fails, the app refuses to start
    rather than serving requests that will all fail anyway.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
