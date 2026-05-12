import json
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.job import Job


async def create_job(db: AsyncSession, dataset_id: str | None, job_type: str) -> Job:
    job = Job(dataset_id=dataset_id, job_type=job_type, status="pending")
    db.add(job)
    await db.flush()
    return job


async def update_job(
    db: AsyncSession,
    job_id: str,
    status: str,
    progress: int | None = None,
    result: dict | None = None,
    error: str | None = None,
):
    result_row = await db.execute(select(Job).where(Job.id == job_id))
    job = result_row.scalar_one_or_none()
    if not job:
        return

    job.status = status
    if progress is not None:
        job.progress = progress
    if result is not None:
        job.result_json = json.dumps(result)
    if error is not None:
        job.error_message = error
    if status == "running" and not job.started_at:
        job.started_at = datetime.utcnow()
    if status in ("completed", "failed"):
        job.completed_at = datetime.utcnow()


async def get_job(db: AsyncSession, job_id: str) -> Job | None:
    result = await db.execute(select(Job).where(Job.id == job_id))
    return result.scalar_one_or_none()


async def list_jobs(
    db: AsyncSession,
    dataset_id: str | None = None,
    status: str | None = None,
    limit: int = 20,
) -> list[Job]:
    q = select(Job).order_by(Job.created_at.desc()).limit(limit)
    if dataset_id:
        q = q.where(Job.dataset_id == dataset_id)
    if status:
        q = q.where(Job.status == status)
    result = await db.execute(q)
    return list(result.scalars().all())
