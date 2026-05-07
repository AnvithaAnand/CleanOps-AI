from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditLog


async def log_action(
    db: AsyncSession,
    dataset_id: str,
    action: str,
    description: str,
    before_snapshot: Optional[str] = None,
    after_snapshot: Optional[str] = None,
    metadata_json: Optional[str] = None,
) -> AuditLog:
    entry = AuditLog(
        dataset_id=dataset_id,
        action=action,
        description=description,
        before_snapshot=before_snapshot,
        after_snapshot=after_snapshot,
        metadata_json=metadata_json,
    )
    db.add(entry)
    await db.flush()
    return entry
