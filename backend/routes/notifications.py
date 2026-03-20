"""
Push notification subscription endpoints.

POST /subscribe     — register a Web Push subscription (idempotent)
POST /unsubscribe   — deactivate a subscription (soft delete)

Both endpoints are rate-limited to 5 requests/minute per IP
to prevent abuse.
"""

import uuid

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from database import get_db
from models import PushSubscription
from schemas import SubscribeRequest, UnsubscribeRequest

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/subscribe")
@limiter.limit("5/minute")
def subscribe(
    request: Request,  # required by slowapi for IP extraction
    body: SubscribeRequest,
    db: Session = Depends(get_db),
) -> JSONResponse:
    """Register a Web Push subscription.

    Idempotent — if the endpoint already exists and is active, returns
    200 instead of creating a duplicate. If it existed but was
    deactivated (user previously unsubscribed), reactivate it.
    """
    existing = (
        db.query(PushSubscription)
        .filter(PushSubscription.endpoint == body.endpoint)
        .first()
    )

    if existing:
        if not existing.is_active:
            # Reactivate a previously unsubscribed endpoint
            existing.is_active = True
            existing.p256dh = body.p256dh
            existing.auth = body.auth
            db.commit()
            return JSONResponse(
                status_code=201,
                content={"message": "Subscription reactivated"},
            )
        # Already active — nothing to do
        return JSONResponse(
            status_code=200,
            content={"message": "Already subscribed"},
        )

    # New subscription
    subscription = PushSubscription(
        id=uuid.uuid4(),
        endpoint=body.endpoint,
        p256dh=body.p256dh,
        auth=body.auth,
        is_active=True,
    )
    db.add(subscription)
    db.commit()

    return JSONResponse(
        status_code=201,
        content={"message": "Subscribed successfully"},
    )


@router.post("/unsubscribe")
@limiter.limit("5/minute")
def unsubscribe(
    request: Request,
    body: UnsubscribeRequest,
    db: Session = Depends(get_db),
) -> JSONResponse:
    """Deactivate a push subscription.

    Soft delete — the record stays in the database with is_active=False
    so we can track churn and avoid re-creating records if the user
    resubscribes later.
    """
    subscription = (
        db.query(PushSubscription)
        .filter(PushSubscription.endpoint == body.endpoint)
        .first()
    )

    if subscription:
        subscription.is_active = False
        db.commit()

    # Always return 200 — don't reveal whether the endpoint existed
    return JSONResponse(
        status_code=200,
        content={"message": "Unsubscribed"},
    )
