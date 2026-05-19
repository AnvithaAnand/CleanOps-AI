import hashlib
import hmac
import json
import logging
from datetime import datetime

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.webhook import WebhookEndpoint

logger = logging.getLogger(__name__)


async def fire_webhooks(db: AsyncSession, event: str, payload: dict):
    result = await db.execute(select(WebhookEndpoint).where(WebhookEndpoint.is_active == True))
    hooks = result.scalars().all()
    for hook in hooks:
        events = json.loads(hook.events or "[]")
        if events and event not in events:
            continue
        asyncio_payload = {
            "event": event,
            "timestamp": datetime.utcnow().isoformat(),
            **payload,
        }
        body = json.dumps(asyncio_payload).encode()
        headers = {"Content-Type": "application/json", "X-CleanOps-Event": event}
        if hook.secret:
            sig = hmac.new(hook.secret.encode(), body, hashlib.sha256).hexdigest()
            headers["X-CleanOps-Signature"] = f"sha256={sig}"
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                await client.post(hook.url, content=body, headers=headers)
        except Exception as e:
            logger.warning(f"Webhook {hook.id} delivery failed: {e}")
