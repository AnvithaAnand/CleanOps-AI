import json
import secrets

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.webhook import WebhookEndpoint

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])

VALID_EVENTS = [
    "scan.completed",
    "repair.completed",
    "alert.fired",
    "drift.detected",
    "contract.violated",
    "trust_score.dropped",
]


class WebhookCreate(BaseModel):
    name: str
    url: str
    events: list[str] = []
    secret: str | None = None


class WebhookToggle(BaseModel):
    is_active: bool


@router.get("/")
async def list_webhooks(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WebhookEndpoint).order_by(WebhookEndpoint.created_at.desc()))
    hooks = result.scalars().all()
    return [
        {
            "id": h.id,
            "name": h.name,
            "url": h.url,
            "events": json.loads(h.events or "[]"),
            "is_active": h.is_active,
            "has_secret": bool(h.secret),
            "created_at": h.created_at.isoformat(),
        }
        for h in hooks
    ]


@router.post("/", status_code=201)
async def create_webhook(body: WebhookCreate, db: AsyncSession = Depends(get_db)):
    if not body.url.startswith(("http://", "https://")):
        raise HTTPException(400, "URL must start with http:// or https://")
    invalid = [e for e in body.events if e not in VALID_EVENTS]
    if invalid:
        raise HTTPException(400, f"Unknown events: {invalid}")
    hook = WebhookEndpoint(
        name=body.name.strip(),
        url=body.url.strip(),
        events=json.dumps(body.events),
        secret=body.secret or None,
        is_active=True,
    )
    db.add(hook)
    await db.commit()
    await db.refresh(hook)
    return {
        "id": hook.id,
        "name": hook.name,
        "url": hook.url,
        "events": json.loads(hook.events),
        "is_active": hook.is_active,
        "has_secret": bool(hook.secret),
        "created_at": hook.created_at.isoformat(),
    }


@router.put("/{hook_id}/toggle")
async def toggle_webhook(hook_id: str, body: WebhookToggle, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WebhookEndpoint).where(WebhookEndpoint.id == hook_id))
    hook = result.scalar_one_or_none()
    if not hook:
        raise HTTPException(404, "Webhook not found")
    hook.is_active = body.is_active
    await db.commit()
    return {"id": hook.id, "is_active": hook.is_active}


@router.post("/{hook_id}/test")
async def test_webhook(hook_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WebhookEndpoint).where(WebhookEndpoint.id == hook_id))
    hook = result.scalar_one_or_none()
    if not hook:
        raise HTTPException(404, "Webhook not found")

    import hashlib, hmac, json as _json
    from datetime import datetime
    payload = {
        "event": "test.ping",
        "timestamp": datetime.utcnow().isoformat(),
        "message": "This is a test delivery from CleanOps AI",
    }
    body_bytes = _json.dumps(payload).encode()
    headers = {"Content-Type": "application/json", "X-CleanOps-Event": "test.ping"}
    if hook.secret:
        sig = hmac.new(hook.secret.encode(), body_bytes, hashlib.sha256).hexdigest()
        headers["X-CleanOps-Signature"] = f"sha256={sig}"

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(hook.url, content=body_bytes, headers=headers)
        return {"ok": resp.status_code < 400, "status_code": resp.status_code}
    except Exception as e:
        return {"ok": False, "error": str(e)}


@router.delete("/{hook_id}", status_code=204)
async def delete_webhook(hook_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WebhookEndpoint).where(WebhookEndpoint.id == hook_id))
    hook = result.scalar_one_or_none()
    if not hook:
        raise HTTPException(404, "Webhook not found")
    await db.delete(hook)
    await db.commit()


@router.get("/events")
async def list_events():
    return VALID_EVENTS
