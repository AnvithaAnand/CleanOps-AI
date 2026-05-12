from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.job import JobResponse
from app.services.job_service import get_job, list_jobs

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


@router.get("/", response_model=list[JobResponse])
async def get_jobs(
    dataset_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    return await list_jobs(db, dataset_id=dataset_id, status=status, limit=limit)


@router.get("/{job_id}", response_model=JobResponse)
async def get_single_job(
    job_id: str,
    db: AsyncSession = Depends(get_db),
):
    job = await get_job(db, job_id)
    if not job:
        from fastapi import HTTPException
        raise HTTPException(404, "Job not found")
    return job
