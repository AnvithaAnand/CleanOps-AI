from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.notification_settings import NotificationSettings

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

_SINGLETON_ID = "global"


class NotificationSettingsRequest(BaseModel):
    email: str | None = None
    notify_on_critical: bool = True
    notify_on_warning: bool = False
    is_active: bool = False


def _serialize(ns: NotificationSettings | None):
    if not ns:
        return {
            "id": _SINGLETON_ID,
            "email": None,
            "notify_on_critical": True,
            "notify_on_warning": False,
            "is_active": False,
        }
    return {
        "id": ns.id,
        "email": ns.email,
        "notify_on_critical": ns.notify_on_critical,
        "notify_on_warning": ns.notify_on_warning,
        "is_active": ns.is_active,
    }


async def _get_or_create(db: AsyncSession) -> NotificationSettings:
    result = await db.execute(select(NotificationSettings).limit(1))
    ns = result.scalar_one_or_none()
    if not ns:
        ns = NotificationSettings(id=_SINGLETON_ID)
        db.add(ns)
        await db.flush()
    return ns


@router.get("/settings")
async def get_notification_settings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(NotificationSettings).limit(1))
    return _serialize(result.scalar_one_or_none())


@router.put("/settings")
async def update_notification_settings(
    body: NotificationSettingsRequest,
    db: AsyncSession = Depends(get_db),
):
    ns = await _get_or_create(db)
    ns.email = body.email
    ns.notify_on_critical = body.notify_on_critical
    ns.notify_on_warning = body.notify_on_warning
    ns.is_active = body.is_active
    await db.commit()
    await db.refresh(ns)
    return _serialize(ns)


@router.post("/test")
async def send_test_notification(db: AsyncSession = Depends(get_db)):
    from app.services.email_service import send_alert_email

    result = await db.execute(select(NotificationSettings).limit(1))
    ns = result.scalar_one_or_none()

    if not ns or not ns.is_active or not ns.email:
        return {"sent": False, "reason": "Notifications not configured or disabled"}

    sent = await send_alert_email(
        to_email=ns.email,
        title="Test Notification",
        message="This is a test alert from CleanOps AI. Your email notifications are working correctly.",
        severity="info",
    )
    return {"sent": sent}
