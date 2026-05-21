from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.audit import AuditLog
from app.models.dataset import Dataset

router = APIRouter(prefix="/api/activity", tags=["activity"])


@router.get("/")
async def get_activity(
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AuditLog, Dataset.name)
        .join(Dataset, AuditLog.dataset_id == Dataset.id)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
    )
    rows = result.all()
    return [
        {
            "id": log.id,
            "dataset_id": log.dataset_id,
            "dataset_name": name,
            "action": log.action,
            "description": log.description,
            "created_at": log.created_at,
        }
        for log, name in rows
    ]
