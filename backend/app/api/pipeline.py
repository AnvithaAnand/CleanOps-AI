import json

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, HttpUrl
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.dataset import Dataset
from app.models.webhook import WebhookEndpoint

router = APIRouter(prefix="/api/pipeline", tags=["pipeline"])

VALID_EVENTS = {"scan.completed", "alert.fired", "contract.violated", "trust_score.dropped"}


# ── Quality Gate ─────────────────────────────────────────────────────────────

@router.get("/gate/{dataset_id}")
async def quality_gate(
    dataset_id: str,
    min_trust_score: float = 80.0,
    db: AsyncSession = Depends(get_db),
):
    """
    CI/CD quality gate. Returns 200 (pass) or 424 (fail).
    Use in pipelines: fail the build if data quality is too low.
    """
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(404, "Dataset not found")

    score = dataset.trust_score
    passed = score is not None and score >= min_trust_score

    body = {
        "dataset_id": dataset_id,
        "dataset_name": dataset.name,
        "trust_score": score,
        "threshold": min_trust_score,
        "passed": passed,
        "status": dataset.status,
        "message": (
            f"PASS — trust score {score:.1f} >= {min_trust_score}"
            if passed
            else f"FAIL — trust score {score if score is not None else 'N/A'} < {min_trust_score}"
        ),
    }

    if not passed:
        raise HTTPException(status_code=424, detail=body)
    return body


# ── Webhooks ──────────────────────────────────────────────────────────────────

class WebhookCreate(BaseModel):
    name: str
    url: str
    events: list[str] = []
    secret: str | None = None


class WebhookUpdate(BaseModel):
    name: str | None = None
    url: str | None = None
    events: list[str] | None = None
    secret: str | None = None
    is_active: bool | None = None


def _serialize(h: WebhookEndpoint):
    return {
        "id": h.id,
        "name": h.name,
        "url": h.url,
        "events": json.loads(h.events or "[]"),
        "is_active": h.is_active,
        "created_at": h.created_at,
    }


@router.get("/webhooks")
async def list_webhooks(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WebhookEndpoint).order_by(WebhookEndpoint.created_at.desc()))
    return [_serialize(h) for h in result.scalars().all()]


@router.post("/webhooks", status_code=201)
async def create_webhook(body: WebhookCreate, db: AsyncSession = Depends(get_db)):
    invalid = [e for e in body.events if e not in VALID_EVENTS]
    if invalid:
        raise HTTPException(400, f"Unknown events: {invalid}. Valid: {list(VALID_EVENTS)}")
    hook = WebhookEndpoint(
        name=body.name,
        url=body.url,
        events=json.dumps(body.events),
        secret=body.secret,
    )
    db.add(hook)
    await db.commit()
    await db.refresh(hook)
    return _serialize(hook)


@router.patch("/webhooks/{webhook_id}")
async def update_webhook(webhook_id: str, body: WebhookUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WebhookEndpoint).where(WebhookEndpoint.id == webhook_id))
    hook = result.scalar_one_or_none()
    if not hook:
        raise HTTPException(404, "Webhook not found")
    if body.name is not None:
        hook.name = body.name
    if body.url is not None:
        hook.url = body.url
    if body.events is not None:
        hook.events = json.dumps(body.events)
    if body.secret is not None:
        hook.secret = body.secret
    if body.is_active is not None:
        hook.is_active = body.is_active
    await db.commit()
    await db.refresh(hook)
    return _serialize(hook)


@router.delete("/webhooks/{webhook_id}", status_code=204)
async def delete_webhook(webhook_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WebhookEndpoint).where(WebhookEndpoint.id == webhook_id))
    hook = result.scalar_one_or_none()
    if not hook:
        raise HTTPException(404, "Webhook not found")
    await db.delete(hook)
    await db.commit()
