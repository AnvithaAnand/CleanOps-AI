import json
from datetime import datetime

import pandas as pd
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.dataset import Dataset, DatasetVersion
from app.models.repair import RepairAction, RepairSuggestion
from app.models.validation import DetectedIssue
from app.services.audit_service import log_action
from app.services.ingestion import parse_file
from app.utils.file_utils import get_version_path
from app.utils.stats_utils import compute_iqr_bounds


async def apply_repairs(
    dataset_id: str,
    suggestion_ids: list[str],
    db: AsyncSession,
) -> dict:
    result = await db.execute(
        select(Dataset).where(Dataset.id == dataset_id)
    )
    dataset = result.scalar_one()

    df = parse_file(dataset.file_path, dataset.file_type)
    total_rows_affected = 0
    repairs_applied = 0

    for sid in suggestion_ids:
        result = await db.execute(
            select(RepairSuggestion).where(RepairSuggestion.id == sid)
        )
        suggestion = result.scalar_one_or_none()
        if not suggestion:
            continue

        result = await db.execute(
            select(DetectedIssue).where(DetectedIssue.id == suggestion.issue_id)
        )
        issue = result.scalar_one_or_none()
        if not issue:
            continue

        before_sample = _get_sample(df, issue)
        rows_affected = _apply_strategy(df, suggestion, issue)
        after_sample = _get_sample(df, issue)

        action = RepairAction(
            suggestion_id=suggestion.id,
            dataset_id=dataset_id,
            status="applied",
            rows_affected=rows_affected,
            applied_at=datetime.utcnow(),
        )
        db.add(action)

        issue.status = "repaired"
        total_rows_affected += rows_affected
        repairs_applied += 1

        await log_action(
            db=db,
            dataset_id=dataset_id,
            action="repair_applied",
            description=f"Applied {suggestion.strategy} on column '{issue.column_name}': {rows_affected} rows affected",
            before_snapshot=json.dumps(before_sample),
            after_snapshot=json.dumps(after_sample),
            metadata_json=json.dumps({
                "strategy": suggestion.strategy,
                "confidence": suggestion.confidence,
                "column": issue.column_name,
                "issue_type": issue.issue_type,
            }),
        )

    version_result = await db.execute(
        select(DatasetVersion)
        .where(DatasetVersion.dataset_id == dataset_id)
        .order_by(DatasetVersion.version_number.desc())
    )
    last_version = version_result.scalar_one_or_none()
    new_version_num = (last_version.version_number + 1) if last_version else 1

    new_path = get_version_path(dataset_id, new_version_num)
    df.to_csv(new_path, index=False)

    version = DatasetVersion(
        dataset_id=dataset_id,
        version_number=new_version_num,
        file_path=new_path,
        row_count=len(df),
        change_summary=json.dumps({
            "repairs_applied": repairs_applied,
            "rows_affected": total_rows_affected,
        }),
    )
    db.add(version)

    dataset.file_path = new_path
    dataset.row_count = len(df)
    await db.flush()

    return {
        "version_number": new_version_num,
        "repairs_applied": repairs_applied,
        "rows_affected": total_rows_affected,
    }


def _apply_strategy(
    df: pd.DataFrame,
    suggestion: RepairSuggestion,
    issue: DetectedIssue,
) -> int:
    col = issue.column_name
    strategy = suggestion.strategy

    if strategy == "mean_imputation" and col:
        numeric = pd.to_numeric(df[col], errors="coerce")
        fill_val = numeric.mean()
        mask = df[col].isna()
        df.loc[mask, col] = fill_val
        return int(mask.sum())

    if strategy == "median_imputation" and col:
        numeric = pd.to_numeric(df[col], errors="coerce")
        fill_val = numeric.median()
        mask = df[col].isna()
        df.loc[mask, col] = fill_val
        return int(mask.sum())

    if strategy == "mode_imputation" and col:
        mode = df[col].mode()
        if len(mode) > 0:
            mask = df[col].isna()
            df.loc[mask, col] = mode.iloc[0]
            return int(mask.sum())
        return 0

    if strategy == "drop_rows" and col:
        before = len(df)
        mask = df[col].isna()
        indices_to_drop = df.index[mask]
        df.drop(indices_to_drop, inplace=True)
        df.reset_index(drop=True, inplace=True)
        return before - len(df)

    if strategy == "deduplicate":
        before = len(df)
        df.drop_duplicates(inplace=True)
        df.reset_index(drop=True, inplace=True)
        return before - len(df)

    if strategy == "clip_outlier" and col:
        numeric = pd.to_numeric(df[col], errors="coerce")
        lower, upper = compute_iqr_bounds(numeric.dropna())
        mask = (numeric < lower) | (numeric > upper)
        df[col] = numeric.clip(lower, upper)
        return int(mask.sum())

    if strategy == "remove_outlier_rows" and col:
        numeric = pd.to_numeric(df[col], errors="coerce")
        lower, upper = compute_iqr_bounds(numeric.dropna())
        mask = (numeric < lower) | (numeric > upper)
        before = len(df)
        df.drop(df.index[mask], inplace=True)
        df.reset_index(drop=True, inplace=True)
        return before - len(df)

    if strategy == "coerce_type" and col:
        original = df[col].copy()
        df[col] = pd.to_numeric(df[col], errors="coerce")
        return int((original.notna() & df[col].isna()).sum())

    return 0


def _get_sample(df: pd.DataFrame, issue: DetectedIssue) -> list[dict]:
    if not issue.affected_rows:
        return []
    try:
        indices = json.loads(issue.affected_rows)[:5]
        valid_indices = [i for i in indices if i < len(df)]
        if not valid_indices:
            return []
        sample = df.iloc[valid_indices]
        return sample.head(5).to_dict(orient="records")
    except Exception:
        return []
