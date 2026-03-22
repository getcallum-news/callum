"""
Callum API — AI news aggregator backend.

This is the application entry point. It wires together:
- Routes (news + notifications)
- CORS (from ALLOWED_ORIGINS env var, never wildcard)
- Security headers (on every response)
- Rate limiting (per-route via slowapi)
- Sentry error monitoring
- Background scheduler (fetches news every 30 minutes)
- Startup validation (env vars + DB connection)
"""

import logging
from contextlib import asynccontextmanager

import sentry_sdk
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.middleware.httpsredirect import HTTPSRedirectMiddleware

from config import (
    ALLOWED_ORIGINS,
    IS_PRODUCTION,
    SENTRY_DSN,
    validate_config,
)
from database import check_db_connection
from routes.news import router as news_router
from routes.notifications import router as notifications_router
from scheduler import start_scheduler

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Sentry — only initialize in production with a valid DSN
# ---------------------------------------------------------------------------

if IS_PRODUCTION and SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        traces_sample_rate=0.1,
        profiles_sample_rate=0.1,
    )
    logger.info("Sentry initialized")


# ---------------------------------------------------------------------------
# Lifespan — startup validation and scheduler management
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle.

    On startup: validate env vars, check DB connection, start scheduler.
    On shutdown: stop the scheduler cleanly.
    """
    # Validate all required environment variables
    validate_config()
    logger.info("Configuration validated")

    # Verify database is reachable
    if not check_db_connection():
        raise RuntimeError(
            "Cannot connect to the database. Check DATABASE_URL in .env"
        )
    logger.info("Database connection verified")

    # Start the background news fetcher
    scheduler = start_scheduler()

    yield

    # Clean shutdown
    scheduler.shutdown(wait=False)
    logger.info("Scheduler stopped")


# ---------------------------------------------------------------------------
# App instance
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Callum",
    description="AI news, filtered.",
    version="1.0.0",
    lifespan=lifespan,
    # Don't expose docs in production — they're useful in dev only
    docs_url="/docs" if not IS_PRODUCTION else None,
    redoc_url=None,
)


# ---------------------------------------------------------------------------
# Rate limiting
# ---------------------------------------------------------------------------

limiter = Limiter(key_func=get_remote_address, default_limits=["30/minute"])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# ---------------------------------------------------------------------------
# CORS — origins loaded from environment, never wildcard
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


# ---------------------------------------------------------------------------
# HTTPS redirect in production
# ---------------------------------------------------------------------------

# Note: HTTPS redirect is handled by Railway/Vercel at the proxy level.
# Adding HTTPSRedirectMiddleware here would cause infinite redirect loops.


# ---------------------------------------------------------------------------
# Security headers — added to every response
# ---------------------------------------------------------------------------

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Attach security headers to every response.

    These headers protect against common web vulnerabilities:
    - nosniff: prevents MIME type sniffing
    - DENY: blocks the site from being embedded in iframes (clickjacking)
    - XSS protection: legacy header, still useful for older browsers
    - Referrer policy: limits referrer info sent to external sites
    - Permissions policy: disables access to device features we don't use
    """
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return response


# ---------------------------------------------------------------------------
# Global error handler — never expose internals to the client
# ---------------------------------------------------------------------------

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch unhandled exceptions and return a safe error response.

    Full details go to Sentry (if configured) and the server log.
    The client only sees a generic message — no stack traces, no DB
    errors, no internal details.
    """
    logger.error("Unhandled exception: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "An unexpected error occurred"},
    )


@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    """Custom 404 response."""
    return JSONResponse(
        status_code=404,
        content={"error": "Not found"},
    )


@app.exception_handler(422)
async def validation_error_handler(request: Request, exc):
    """Custom validation error response.

    FastAPI returns 422 for Pydantic validation failures. We reformat
    the response to match our standard error shape.
    """
    details = []
    if hasattr(exc, "detail"):
        if isinstance(exc.detail, list):
            details = [str(err) for err in exc.detail]
        else:
            details = [str(exc.detail)]

    return JSONResponse(
        status_code=422,
        content={"error": "Invalid input", "detail": details},
    )


# ---------------------------------------------------------------------------
# Mount routes
# ---------------------------------------------------------------------------

app.include_router(news_router, tags=["News"])
app.include_router(notifications_router, tags=["Notifications"])
