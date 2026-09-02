import asyncio
import logging
from datetime import datetime, timedelta

from sqlalchemy import select

from app.database import async_session
from app.models.schedule import ScanSchedule
from app.models.dataset import Dataset
from app.services.ingestion import parse_file
from app.services.job_service import create_job, update_job
from app.services.profiler import profile_dataset
from app.services.detector import detect_issues
from app.services.trust_score import calculate_trust_score
from app.services.drift_service import detect_drift, has_baseline, save_baseline
from app.services.alert_service import evaluate_alert_rules
from app.models.profile import ColumnProfile

logger = logging.getLogger(__name__)

FREQ_DELTA = {
    "hourly": timedelta(hours=1),
    "daily": timedelta(days=1),
    "weekly": timedelta(weeks=1),
}


def next_run(frequency: str) -> datetime:
    return datetime.utcnow() + FREQ_DELTA.get(frequency, timedelta(days=1))


async def get_schedule(db, dataset_id: str):
    result = await db.execute(select(ScanSchedule).where(ScanSchedule.dataset_id == dataset_id))
    return result.scalar_one_or_none()


async def upsert_schedule(db, dataset_id: str, frequency: str, is_active: bool = True):
    schedule = await get_schedule(db, dataset_id)
    if schedule:
        schedule.frequency = frequency
        schedule.is_active = is_active
        if is_active:
            schedule.next_run_at = next_run(frequency)
    else:
        from app.models.schedule import ScanSchedule as S
        schedule = S(
            dataset_id=dataset_id,
            frequency=frequency,
            is_active=is_active,
            next_run_at=next_run(frequency),
        )
        db.add(schedule)
    await db.commit()
    await db.refresh(schedule)
    return schedule


async def delete_schedule(db, dataset_id: str):
    schedule = await get_schedule(db, dataset_id)
    if schedule:
        await db.delete(schedule)
        await db.commit()


async def _run_scheduled_scan(dataset_id: str, schedule_id: str):
    async with async_session() as db:
        try:
            result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
            dataset = result.scalar_one_or_none()
            if not dataset or not dataset.file_path:
                return

            df = parse_file(dataset.file_path, dataset.file_type)
            dataset.row_count = len(df)
            dataset.column_count = len(df.columns)

            job = await create_job(db, dataset_id, "scheduled_scan")
            await db.commit()

            await update_job(db, job.id, "running", progress=10)
            await db.commit()

            profiles = await profile_dataset(dataset_id, df, db)
            await db.commit()

            await update_job(db, job.id, "running", progress=40)
            await db.commit()

            issues = await detect_issues(dataset_id, df, db)
            await db.commit()

            ts_result = calculate_trust_score(dataset_id, profiles, issues, dataset.row_count or 0)
            dataset.trust_score = ts_result.overall_score
            dataset.status = "profiled"
            await db.commit()

            col_result = await db.execute(select(ColumnProfile).where(ColumnProfile.dataset_id == dataset_id))
            col_profiles = col_result.scalars().all()

            if await has_baseline(db, dataset_id):
                drift_reports = await detect_drift(db, dataset_id, col_profiles, dataset.row_count or 0)
                await db.commit()
            else:
                await save_baseline(db, dataset_id, col_profiles)
                drift_reports = []
                await db.commit()

            await evaluate_alert_rules(db, dataset_id, ts_result.overall_score, len(issues), col_profiles, drift_reports)
            await db.commit()

            await update_job(db, job.id, "completed", progress=100)

            result2 = await db.execute(select(ScanSchedule).where(ScanSchedule.id == schedule_id))
            schedule = result2.scalar_one_or_none()
            if schedule:
                schedule.last_run_at = datetime.utcnow()
                schedule.next_run_at = next_run(schedule.frequency)
            await db.commit()

            logger.info(f"Scheduled scan completed for dataset {dataset_id}")
        except Exception as e:
            await db.rollback()
            try:
                await update_job(db, job.id, "failed", error=str(e))
                await db.commit()
            except Exception:
                pass
            logger.error(f"Scheduled scan failed for dataset {dataset_id}: {e}")


async def scheduler_loop():
    logger.info("Scheduler loop started")
    while True:
        try:
            async with async_session() as db:
                now = datetime.utcnow()
                result = await db.execute(
                    select(ScanSchedule).where(
                        ScanSchedule.is_active == True,
                        ScanSchedule.next_run_at <= now,
                    )
                )
                due = result.scalars().all()
                for schedule in due:
                    logger.info(f"Triggering scheduled scan for dataset {schedule.dataset_id}")
                    asyncio.create_task(_run_scheduled_scan(schedule.dataset_id, schedule.id))
        except Exception as e:
            logger.error(f"Scheduler loop error: {e}")
        await asyncio.sleep(60)
