from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.alert import Alert, AlertRule
from app.models.drift import DriftReport
from app.models.notification_settings import NotificationSettings
from app.models.profile import ColumnProfile
from app.models.validation import DetectedIssue
from app.services.webhook_service import fire_webhooks


async def _maybe_send_email(db: AsyncSession, title: str, message: str, severity: str):
    result = await db.execute(select(NotificationSettings).limit(1))
    ns = result.scalar_one_or_none()
    if not ns or not ns.is_active or not ns.email:
        return
    if severity == "critical" and not ns.notify_on_critical:
        return
    if severity == "warning" and not ns.notify_on_warning:
        return
    if severity == "info":
        return
    from app.services.email_service import send_alert_email
    await send_alert_email(ns.email, title, message, severity)


async def create_alert(db: AsyncSession, dataset_id: str | None, alert_type: str,
                        severity: str, title: str, message: str) -> Alert:
    alert = Alert(
        dataset_id=dataset_id,
        alert_type=alert_type,
        severity=severity,
        title=title,
        message=message,
    )
    db.add(alert)
    await db.flush()
    await fire_webhooks(db, "alert.fired", {
        "dataset_id": dataset_id,
        "alert_type": alert_type,
        "severity": severity,
        "title": title,
        "message": message,
    })
    await _maybe_send_email(db, title, message, severity)
    return alert


async def evaluate_alert_rules(db: AsyncSession, dataset_id: str,
                                 trust_score: float, issue_count: int,
                                 profiles: list[ColumnProfile],
                                 drift_reports: list[DriftReport] | None = None):
    """Check all active rules and fire alerts as needed."""
    result = await db.execute(
        select(AlertRule).where(
            AlertRule.is_active == True,  # noqa: E712
            (AlertRule.dataset_id == dataset_id) | (AlertRule.dataset_id == None),  # noqa: E711
        )
    )
    rules = result.scalars().all()

    for rule in rules:
        if rule.condition_type == "trust_score_below":
            threshold = rule.threshold if rule.threshold is not None else 70.0
            if trust_score < threshold:
                await create_alert(
                    db, dataset_id, "trust_score",
                    "critical" if trust_score < 50 else "warning",
                    f"Low Trust Score: {trust_score:.0f}%",
                    f"Dataset trust score dropped to {trust_score:.1f}%, below the {threshold:.0f}% threshold.",
                )

        elif rule.condition_type == "issue_count_above":
            threshold = int(rule.threshold) if rule.threshold is not None else 10
            if issue_count > threshold:
                await create_alert(
                    db, dataset_id, "issues",
                    "warning",
                    f"{issue_count} Issues Detected",
                    f"Dataset has {issue_count} open issues, exceeding the threshold of {threshold}.",
                )

        elif rule.condition_type == "null_rate_above":
            threshold = rule.threshold if rule.threshold is not None else 20.0
            high_null_cols = [
                p.column_name for p in profiles
                if (p.null_percentage or 0) > threshold
            ]
            if high_null_cols:
                cols_str = ", ".join(high_null_cols[:5])
                await create_alert(
                    db, dataset_id, "null_rate",
                    "warning",
                    f"High Null Rate in {len(high_null_cols)} Column(s)",
                    f"Columns with >{threshold:.0f}% nulls: {cols_str}.",
                )

        elif rule.condition_type == "drift_detected" and drift_reports:
            high_drift = [r for r in drift_reports if r.severity == "high"]
            if high_drift:
                await create_alert(
                    db, dataset_id, "drift",
                    "critical",
                    f"Data Drift Detected ({len(high_drift)} High Severity)",
                    f"{len(high_drift)} high-severity drift signal(s) detected. "
                    f"Example: {high_drift[0].description[:120]}",
                )
            elif drift_reports:
                await create_alert(
                    db, dataset_id, "drift",
                    "warning",
                    f"Data Drift Detected ({len(drift_reports)} Signal(s))",
                    f"{len(drift_reports)} drift signal(s) detected in the latest profile run.",
                )

    await db.flush()


async def get_alerts(db: AsyncSession, dataset_id: str | None = None,
                      unread_only: bool = False, limit: int = 50) -> list[Alert]:
    q = select(Alert).order_by(Alert.created_at.desc()).limit(limit)
    if dataset_id:
        q = q.where(Alert.dataset_id == dataset_id)
    if unread_only:
        q = q.where(Alert.is_read == False)  # noqa: E712
    result = await db.execute(q)
    return result.scalars().all()


async def get_unread_count(db: AsyncSession) -> int:
    result = await db.execute(
        select(Alert).where(Alert.is_read == False)  # noqa: E712
    )
    return len(result.scalars().all())


async def mark_all_read(db: AsyncSession, dataset_id: str | None = None):
    q = update(Alert).where(Alert.is_read == False)  # noqa: E712
    if dataset_id:
        q = q.where(Alert.dataset_id == dataset_id)
    await db.execute(q.values(is_read=True))
    await db.flush()


async def mark_read(db: AsyncSession, alert_id: str):
    await db.execute(
        update(Alert).where(Alert.id == alert_id).values(is_read=True)
    )
    await db.flush()


async def seed_default_rules(db: AsyncSession):
    """Create default alert rules if none exist."""
    result = await db.execute(select(AlertRule).limit(1))
    if result.scalar_one_or_none():
        return
    defaults = [
        AlertRule(name="Low Trust Score (<70%)", condition_type="trust_score_below", threshold=70.0),
        AlertRule(name="High Issue Count (>20)", condition_type="issue_count_above", threshold=20.0),
        AlertRule(name="High Null Rate (>25%)",  condition_type="null_rate_above",   threshold=25.0),
        AlertRule(name="Drift Detected",          condition_type="drift_detected"),
    ]
    for r in defaults:
        db.add(r)
    await db.flush()
