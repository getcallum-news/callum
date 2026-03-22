"""
Central configuration module for Callum backend.

Loads all environment variables on import and validates that every
required variable is present. If anything is missing, the app fails
fast with a clear error — no silent fallbacks, no hardcoded defaults
for secrets.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the backend directory
_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(_env_path)


# ---------------------------------------------------------------------------
# Required variables — the app will refuse to start without these
# ---------------------------------------------------------------------------

REQUIRED_VARS = [
    "DATABASE_URL",
    "SECRET_KEY",
    "ALLOWED_ORIGINS",
]

# Optional — these enable extra features but are not required to run
OPTIONAL_VARS = [
    "SENTRY_DSN",
    "FIREBASE_CREDENTIALS_PATH",
    "VAPID_PRIVATE_KEY",
    "VAPID_PUBLIC_KEY",
    "VAPID_CLAIMS_EMAIL",
]


def _validate_env() -> None:
    """Check that all required environment variables are set.

    Raises RuntimeError with a list of every missing variable so the
    developer can fix them all at once instead of one at a time.
    """
    missing = [var for var in REQUIRED_VARS if not os.getenv(var)]

    # Log warnings for optional vars that are missing (but don't crash)
    import logging
    _logger = logging.getLogger(__name__)
    for var in OPTIONAL_VARS:
        if not os.getenv(var):
            _logger.warning("Optional env var %s is not set — related features will be disabled", var)

    if missing:
        raise RuntimeError(
            "Missing required environment variables:\n"
            + "\n".join(f"  - {var}" for var in missing)
            + "\n\nCopy .env.example to .env and fill in the values."
        )


# ---------------------------------------------------------------------------
# Configuration values
# ---------------------------------------------------------------------------

# Database
DATABASE_URL: str = os.getenv("DATABASE_URL", "")

# Security
SECRET_KEY: str = os.getenv("SECRET_KEY", "")
ALLOWED_ORIGINS: list[str] = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]

# Firebase / Push notifications
FIREBASE_CREDENTIALS_PATH: str = os.getenv("FIREBASE_CREDENTIALS_PATH", "")
VAPID_PRIVATE_KEY: str = os.getenv("VAPID_PRIVATE_KEY", "")
VAPID_PUBLIC_KEY: str = os.getenv("VAPID_PUBLIC_KEY", "")
VAPID_CLAIMS_EMAIL: str = os.getenv("VAPID_CLAIMS_EMAIL", "")

# Monitoring
SENTRY_DSN: str = os.getenv("SENTRY_DSN", "")

# Environment flag
IS_PRODUCTION: bool = os.getenv("IS_PRODUCTION", "false").lower() == "true"


def validate_config() -> None:
    """Public entry point for startup validation.

    Called from main.py lifespan event so the app crashes immediately
    if the environment is misconfigured.
    """
    _validate_env()
