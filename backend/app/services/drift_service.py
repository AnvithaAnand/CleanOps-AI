import json
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.drift import DriftReport, ProfileBaseline
from app.models.profile import ColumnProfile


def _profile_to_stats(p: ColumnProfile) -> dict:
    return {
        "data_type": p.detected_type,
        "null_count": p.null_count,
        "null_percentage": p.null_percentage,
        "unique_count": p.unique_count,
        "mean": p.mean_value,
        "std_dev": p.std_dev,
        "min_value": p.min_value,
        "max_value": p.max_value,
    }


async def save_baseline(db: AsyncSession, dataset_id: str, profiles: list[ColumnProfile]):
    await db.execute(delete(ProfileBaseline).where(ProfileBaseline.dataset_id == dataset_id))
    for p in profiles:
        baseline = ProfileBaseline(
            dataset_id=dataset_id,
            column_name=p.column_name,
            baseline_stats=json.dumps(_profile_to_stats(p)),
        )
        db.add(baseline)
    await db.flush()


async def detect_drift(db: AsyncSession, dataset_id: str,
                        profiles: list[ColumnProfile], row_count: int) -> list[DriftReport]:
    result = await db.execute(
        select(ProfileBaseline).where(ProfileBaseline.dataset_id == dataset_id)
    )
    baselines = {b.column_name: json.loads(b.baseline_stats) for b in result.scalars().all()}

    if not baselines:
        return []

    # Clear old drift reports
    await db.execute(delete(DriftReport).where(DriftReport.dataset_id == dataset_id))

    current_cols = {p.column_name for p in profiles}
    baseline_cols = set(baselines.keys())
    reports: list[DriftReport] = []

    # Schema drift: added/removed columns
    for col in baseline_cols - current_cols:
        reports.append(DriftReport(
            dataset_id=dataset_id,
            drift_type="schema",
            severity="high",
            column_name=col,
            description=f"Column '{col}' was present in baseline but is now missing",
            baseline_value=col,
            current_value=None,
        ))
    for col in current_cols - baseline_cols:
        reports.append(DriftReport(
            dataset_id=dataset_id,
            drift_type="schema",
            severity="medium",
            column_name=col,
            description=f"New column '{col}' appeared that was not in baseline",
            baseline_value=None,
            current_value=col,
        ))

    profile_map = {p.column_name: p for p in profiles}

    for col, base in baselines.items():
        curr_profile = profile_map.get(col)
        if not curr_profile:
            continue

        # Type change
        if base["data_type"] and curr_profile.detected_type and base["data_type"] != curr_profile.detected_type:
            reports.append(DriftReport(
                dataset_id=dataset_id,
                drift_type="schema",
                severity="high",
                column_name=col,
                description=f"Column '{col}' type changed from {base['data_type']} to {curr_profile.detected_type}",
                baseline_value=base["data_type"],
                current_value=curr_profile.detected_type,
            ))

        # Null rate drift (>10pp change)
        base_null = base.get("null_percentage") or 0.0
        curr_null = curr_profile.null_percentage or 0.0
        null_delta = abs(curr_null - base_null)
        if null_delta > 10.0:
            severity = "high" if null_delta > 25 else "medium"
            reports.append(DriftReport(
                dataset_id=dataset_id,
                drift_type="distribution",
                severity=severity,
                column_name=col,
                description=f"Null rate for '{col}' changed by {null_delta:.1f}pp ({base_null:.1f}% → {curr_null:.1f}%)",
                baseline_value=str(round(base_null, 2)),
                current_value=str(round(curr_null, 2)),
                drift_score=null_delta / 100,
            ))

        # Mean drift for numeric columns (>20% relative change)
        base_mean = base.get("mean")
        curr_mean = curr_profile.mean_value
        if base_mean is not None and curr_mean is not None and base_mean != 0:
            rel_change = abs(curr_mean - base_mean) / abs(base_mean)
            if rel_change > 0.20:
                severity = "high" if rel_change > 0.50 else "medium"
                reports.append(DriftReport(
                    dataset_id=dataset_id,
                    drift_type="distribution",
                    severity=severity,
                    column_name=col,
                    description=f"Mean of '{col}' shifted by {rel_change*100:.1f}% ({base_mean:.2f} → {curr_mean:.2f})",
                    baseline_value=str(round(base_mean, 4)),
                    current_value=str(round(curr_mean, 4)),
                    drift_score=min(rel_change, 1.0),
                ))

    # Volume drift (>20% row count change) — baseline row count estimated from first profile
    base_row_estimate = None
    for col, base in baselines.items():
        if base.get("null_count") is not None and base.get("null_percentage") is not None:
            pct = base["null_percentage"]
            if pct is not None and pct < 100:
                null_c = base["null_count"] or 0
                non_null = (base.get("unique_count") or 0)
                # estimate from null_percentage: null_count / (null_pct/100)
                if pct > 0:
                    base_row_estimate = round(null_c / (pct / 100))
                    break

    if base_row_estimate and base_row_estimate > 0:
        vol_delta = abs(row_count - base_row_estimate) / base_row_estimate
        if vol_delta > 0.20:
            severity = "high" if vol_delta > 0.50 else "medium"
            reports.append(DriftReport(
                dataset_id=dataset_id,
                drift_type="volume",
                severity=severity,
                column_name=None,
                description=f"Row count changed by {vol_delta*100:.1f}% (baseline ~{base_row_estimate:,} → current {row_count:,})",
                baseline_value=str(base_row_estimate),
                current_value=str(row_count),
                drift_score=min(vol_delta, 1.0),
            ))

    for r in reports:
        db.add(r)
    await db.flush()
    return reports


async def get_drift_reports(db: AsyncSession, dataset_id: str) -> list[DriftReport]:
    result = await db.execute(
        select(DriftReport)
        .where(DriftReport.dataset_id == dataset_id)
        .order_by(DriftReport.created_at.desc())
    )
    return result.scalars().all()


async def has_baseline(db: AsyncSession, dataset_id: str) -> bool:
    result = await db.execute(
        select(ProfileBaseline).where(ProfileBaseline.dataset_id == dataset_id).limit(1)
    )
    return result.scalar_one_or_none() is not None
