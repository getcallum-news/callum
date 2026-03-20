"""
Push notification sender.

Sends Web Push notifications to all active subscribers when new
articles arrive. Uses pywebpush with VAPID authentication.

Handles stale subscriptions gracefully — if a browser returns 410
(user unsubscribed or cleared site data), the subscription is
automatically deactivated so we stop wasting requests on it.
"""

import json
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

from pywebpush import webpush, WebPushException
from sqlalchemy.orm import Session

from config import VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY, VAPID_CLAIMS_EMAIL
from models import PushSubscription

logger = logging.getLogger(__name__)

# Max concurrent push sends — don't overwhelm the push services
MAX_WORKERS = 20


def _build_payload(new_article_count: int) -> str:
    """Build the JSON notification payload.

    Kept simple — title, body, icon, and the URL to open on click.
    """
    return json.dumps({
        "title": "Callum — New AI News",
        "body": f"{new_article_count} new article{'s' if new_article_count != 1 else ''} just arrived.",
        "icon": "/icon-192.png",
        "url": "/",
    })


def _send_single_notification(
    endpoint: str,
    p256dh: str,
    auth: str,
    payload: str,
) -> tuple[str, bool, str]:
    """Send a push notification to a single subscriber.

    Returns:
        Tuple of (endpoint, success: bool, error_message: str).
        error_message is empty on success.
    """
    subscription_info = {
        "endpoint": endpoint,
        "keys": {
            "p256dh": p256dh,
            "auth": auth,
        },
    }

    try:
        webpush(
            subscription_info=subscription_info,
            data=payload,
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims={"sub": f"mailto:{VAPID_CLAIMS_EMAIL}"},
        )
        return endpoint, True, ""
    except WebPushException as e:
        return endpoint, False, str(e)
    except Exception as e:
        return endpoint, False, str(e)


def send_notifications(db: Session, new_article_count: int) -> None:
    """Send push notifications to all active subscribers.

    Uses a thread pool for concurrent sends since pywebpush is
    synchronous. Deactivates subscriptions that return 410 Gone.

    Args:
        db: Database session for querying subscriptions and updating status.
        new_article_count: Number of new articles to include in the message.
    """
    if new_article_count == 0:
        return

    # Load all active subscriptions
    subscriptions = (
        db.query(PushSubscription)
        .filter(PushSubscription.is_active.is_(True))
        .all()
    )

    if not subscriptions:
        logger.info("No active subscribers — skipping notifications")
        return

    payload = _build_payload(new_article_count)
    sent = 0
    failed = 0

    # Send concurrently using threads (pywebpush is blocking I/O)
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {
            executor.submit(
                _send_single_notification,
                sub.endpoint,
                sub.p256dh,
                sub.auth,
                payload,
            ): sub
            for sub in subscriptions
        }

        for future in as_completed(futures):
            sub = futures[future]
            try:
                endpoint, success, error_msg = future.result()

                if success:
                    sent += 1
                else:
                    failed += 1
                    # 410 Gone means the subscription is no longer valid —
                    # the user unsubscribed from the browser or cleared
                    # site data. Deactivate it so we stop trying.
                    if "410" in error_msg:
                        sub.is_active = False
                        db.commit()
                        logger.info("Deactivated stale subscription: %s", endpoint[:40])
                    else:
                        logger.warning(
                            "Push failed for %s: %s", endpoint[:40], error_msg
                        )
            except Exception as e:
                failed += 1
                logger.error("Push notification error: %s", e)

    logger.info(
        "Push notifications: %d sent, %d failed, %d total subscribers",
        sent, failed, len(subscriptions),
    )
