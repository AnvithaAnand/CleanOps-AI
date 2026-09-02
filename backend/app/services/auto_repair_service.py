import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.dataset import Dataset
from app.models.repair import RepairSuggestion
from app.models.validation import DetectedIssue
from app.models.auto_repair import AutoRepairConfig
from app.services.repairer import apply_repairs
from app.services.job_service import create_job, update_job

logger = logging.getLogger(__name__)

SAFE_STRATEGIES = {
    "mean_imputation", "median_imputation", "mode_imputation",
    "deduplicate", "drop_rows", "clip_outlier", "coerce_type",
}


async def get_config(db: AsyncSession, dataset_id: str):
    result = await db.execute(select(AutoRepairConfig).where(AutoRepairConfig.dataset_id == dataset_id))
    return result.scalar_one_or_none()


async def upsert_config(db: AsyncSession, dataset_id: str, is_active: bool, min_confidence: float = 0.8):
    config = await get_config(db, dataset_id)
    if config:
        config.is_active = is_active
        config.min_confidence = min_confidence
    else:
        config = AutoRepairConfig(dataset_id=dataset_id, is_active=is_active, min_confidence=min_confidence)
        db.add(config)
    await db.commit()
    await db.refresh(config)
    return config


async def run_auto_repair(db: AsyncSession, dataset_id: str):
    config = await get_config(db, dataset_id)
    if not config or not config.is_active:
        return {"skipped": True, "reason": "auto-repair not enabled"}

    # Find all recommended suggestions with safe strategies above confidence threshold
    result = await db.execute(
        select(RepairSuggestion)
        .join(DetectedIssue, RepairSuggestion.issue_id == DetectedIssue.id)
        .where(
            DetectedIssue.dataset_id == dataset_id,
            RepairSuggestion.is_recommended == True,
            RepairSuggestion.confidence >= config.min_confidence,
        )
    )
    suggestions = result.scalars().all()
    safe = [s for s in suggestions if s.strategy in SAFE_STRATEGIES]

    if not safe:
        return {"skipped": True, "reason": "no safe repairs available"}

    job = await create_job(db, dataset_id, "auto_repair")
    await db.commit()

    try:
        await update_job(db, job.id, "running", progress=10)
        await db.commit()
        result = await apply_repairs(dataset_id, [s.id for s in safe], db)
        await db.commit()
        await update_job(db, job.id, "completed", progress=100,
                         result={"repairs_applied": result.get("repairs_applied", 0)})
        await db.commit()
        logger.info(f"Auto-repair completed for {dataset_id}: {result.get('repairs_applied')} repairs")
        return {"repairs_applied": result.get("repairs_applied", 0), "job_id": job.id}
    except Exception as e:
        await update_job(db, job.id, "failed", error=str(e))
        await db.commit()
        raise
