from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.dataset import Dataset
from app.models.schedule import ScanSchedule
from app.services.scheduler_service import delete_schedule, get_schedule, upsert_schedule

router = APIRouter(prefix="/api/schedules", tags=["schedules"])

VALID_FREQUENCIES = {"hourly", "daily", "weekly"}


class ScheduleRequest(BaseModel):
    frequency: str
    is_active: bool = True


@router.get("/{dataset_id}")
async def get_dataset_schedule(dataset_id: str, db: AsyncSession = Depends(get_db)):
    schedule = await get_schedule(db, dataset_id)
    if not schedule:
        return None
    return {
        "id": schedule.id,
        "dataset_id": schedule.dataset_id,
        "frequency": schedule.frequency,
        "is_active": schedule.is_active,
        "next_run_at": schedule.next_run_at,
        "last_run_at": schedule.last_run_at,
    }


@router.put("/{dataset_id}")
async def set_schedule(dataset_id: str, body: ScheduleRequest, db: AsyncSession = Depends(get_db)):
    if body.frequency not in VALID_FREQUENCIES:
        raise HTTPException(400, f"frequency must be one of: {', '.join(VALID_FREQUENCIES)}")
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    if not result.scalar_one_or_none():
        raise HTTPException(404, "Dataset not found")
    schedule = await upsert_schedule(db, dataset_id, body.frequency, body.is_active)
    return {
        "id": schedule.id,
        "dataset_id": schedule.dataset_id,
        "frequency": schedule.frequency,
        "is_active": schedule.is_active,
        "next_run_at": schedule.next_run_at,
        "last_run_at": schedule.last_run_at,
    }


@router.delete("/{dataset_id}", status_code=204)
async def remove_schedule(dataset_id: str, db: AsyncSession = Depends(get_db)):
    await delete_schedule(db, dataset_id)


@router.get("/")
async def list_schedules(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ScanSchedule).where(ScanSchedule.is_active == True))
    schedules = result.scalars().all()
    return [
        {
            "id": s.id,
            "dataset_id": s.dataset_id,
            "frequency": s.frequency,
            "is_active": s.is_active,
            "next_run_at": s.next_run_at,
            "last_run_at": s.last_run_at,
        }
        for s in schedules
    ]
