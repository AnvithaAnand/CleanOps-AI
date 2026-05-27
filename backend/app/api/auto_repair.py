from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session, get_db
from app.models.dataset import Dataset
from app.services.auto_repair_service import get_config, run_auto_repair, upsert_config

router = APIRouter(prefix="/api/auto-repair", tags=["auto-repair"])


class AutoRepairConfigRequest(BaseModel):
    is_active: bool
    min_confidence: float = 0.8


def _serialize(config):
    if not config:
        return None
    return {
        "id": config.id,
        "dataset_id": config.dataset_id,
        "is_active": config.is_active,
        "min_confidence": config.min_confidence,
    }


@router.get("/{dataset_id}")
async def get_auto_repair_config(dataset_id: str, db: AsyncSession = Depends(get_db)):
    return _serialize(await get_config(db, dataset_id))


@router.put("/{dataset_id}")
async def set_auto_repair_config(dataset_id: str, body: AutoRepairConfigRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    if not result.scalar_one_or_none():
        raise HTTPException(404, "Dataset not found")
    config = await upsert_config(db, dataset_id, body.is_active, body.min_confidence)
    return _serialize(config)


@router.post("/{dataset_id}/run")
async def trigger_auto_repair(dataset_id: str, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    if not result.scalar_one_or_none():
        raise HTTPException(404, "Dataset not found")

    async def _run():
        async with async_session() as session:
            await run_auto_repair(session, dataset_id)

    background_tasks.add_task(_run)
    return {"status": "started"}
