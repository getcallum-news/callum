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

import logging
_db_logger = logging.getLogger(__name__)

# Ensure sslmode=require for Supabase connections
_db_url = DATABASE_URL
if _db_url and "sslmode" not in _db_url:
    separator = "&" if "?" in _db_url else "?"
    _db_url = f"{_db_url}{separator}sslmode=require"

_db_logger.info("Connecting to database: %s", _db_url[:30] + "..." if _db_url else "(empty)")

# SQLAlchemy engine — pool_pre_ping keeps connections alive across
# Supabase's idle timeout, so we don't hit stale connection errors.
engine = create_engine(
    _db_url,
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
    import logging
    logger = logging.getLogger(__name__)
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error("Database connection failed: %s", e)
        return False
