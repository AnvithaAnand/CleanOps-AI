from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.alert import Alert, AlertRule
from app.services.alert_service import get_alerts, get_unread_count, mark_all_read, mark_read

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


class AlertRuleCreate(BaseModel):
    name: str
    condition_type: str
    threshold: Optional[float] = None
    dataset_id: Optional[str] = None


def _alert_to_dict(a: Alert) -> dict:
    return {
        "id": a.id,
        "dataset_id": a.dataset_id,
        "alert_type": a.alert_type,
        "severity": a.severity,
        "title": a.title,
        "message": a.message,
        "is_read": a.is_read,
        "created_at": a.created_at.isoformat(),
    }


def _rule_to_dict(r: AlertRule) -> dict:
    return {
        "id": r.id,
        "name": r.name,
        "condition_type": r.condition_type,
        "threshold": r.threshold,
        "dataset_id": r.dataset_id,
        "is_active": r.is_active,
        "created_at": r.created_at.isoformat(),
    }


@router.get("/")
async def list_alerts(
    dataset_id: Optional[str] = Query(None),
    unread_only: bool = Query(False),
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
):
    alerts = await get_alerts(db, dataset_id=dataset_id, unread_only=unread_only, limit=limit)
    return [_alert_to_dict(a) for a in alerts]


@router.get("/unread-count")
async def unread_count(db: AsyncSession = Depends(get_db)):
    count = await get_unread_count(db)
    return {"count": count}


@router.post("/mark-read")
async def mark_alerts_read(
    alert_id: Optional[str] = Query(None),
    dataset_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    if alert_id:
        await mark_read(db, alert_id)
    else:
        await mark_all_read(db, dataset_id=dataset_id)
    await db.commit()
    return {"status": "ok"}


@router.delete("/{alert_id}")
async def delete_alert(alert_id: str, db: AsyncSession = Depends(get_db)):
    await db.execute(delete(Alert).where(Alert.id == alert_id))
    await db.commit()
    return {"status": "deleted"}


# ── Rules ──────────────────────────────────────────────────────────────────────

@router.get("/rules")
async def list_rules(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AlertRule).order_by(AlertRule.created_at))
    return [_rule_to_dict(r) for r in result.scalars().all()]


@router.post("/rules", status_code=201)
async def create_rule(body: AlertRuleCreate, db: AsyncSession = Depends(get_db)):
    rule = AlertRule(
        name=body.name,
        condition_type=body.condition_type,
        threshold=body.threshold,
        dataset_id=body.dataset_id,
    )
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return _rule_to_dict(rule)


@router.patch("/rules/{rule_id}")
async def toggle_rule(rule_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AlertRule).where(AlertRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(404, "Rule not found")
    rule.is_active = not rule.is_active
    await db.commit()
    return _rule_to_dict(rule)


@router.delete("/rules/{rule_id}")
async def delete_rule(rule_id: str, db: AsyncSession = Depends(get_db)):
    await db.execute(delete(AlertRule).where(AlertRule.id == rule_id))
    await db.commit()
    return {"status": "deleted"}
