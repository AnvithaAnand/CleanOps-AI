import json
import uuid

import numpy as np
import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.repair import RepairSuggestion
from app.models.validation import DetectedIssue, ValidationRun
from app.utils.stats_utils import compute_iqr_bounds


async def detect_issues(
    dataset_id: str, df: pd.DataFrame, db: AsyncSession
) -> list[DetectedIssue]:
    run = ValidationRun(
        dataset_id=dataset_id,
        status="running",
    )
    db.add(run)
    await db.flush()

    issues: list[DetectedIssue] = []

    issues.extend(await _detect_missing(dataset_id, run.id, df, db))
    issues.extend(await _detect_duplicates(dataset_id, run.id, df, db))
    issues.extend(await _detect_outliers(dataset_id, run.id, df, db))
    issues.extend(await _detect_type_mismatches(dataset_id, run.id, df, db))

    run.status = "completed"
    run.total_issues_found = len(issues)
    run.total_rules_checked = 4
    await db.flush()

    return issues


async def _detect_missing(
    dataset_id: str, run_id: str, df: pd.DataFrame, db: AsyncSession
) -> list[DetectedIssue]:
    issues = []
    for col in df.columns:
        null_count = int(df[col].isna().sum())
        if null_count == 0:
            continue

        null_pct = round(null_count / len(df) * 100, 1)
        null_indices = df.index[df[col].isna()].tolist()[:50]

        severity = "critical" if null_pct > 30 else "warning" if null_pct > 5 else "info"

        issue = DetectedIssue(
            validation_run_id=run_id,
            dataset_id=dataset_id,
            issue_type="missing_value",
            severity=severity,
            column_name=col,
            affected_rows=json.dumps(null_indices),
            affected_count=null_count,
            description=f"Column '{col}' has {null_count} missing values ({null_pct}%)",
            status="open",
        )
        db.add(issue)
        await db.flush()

        await _suggest_missing_repairs(issue, df[col], db)
        issues.append(issue)

    return issues


async def _detect_duplicates(
    dataset_id: str, run_id: str, df: pd.DataFrame, db: AsyncSession
) -> list[DetectedIssue]:
    issues = []
    dup_mask = df.duplicated(keep=False)
    dup_count = int(dup_mask.sum())
    if dup_count > 0:
        dup_indices = df.index[dup_mask].tolist()[:50]
        issue = DetectedIssue(
            validation_run_id=run_id,
            dataset_id=dataset_id,
            issue_type="duplicate_row",
            severity="warning" if dup_count < len(df) * 0.1 else "critical",
            affected_rows=json.dumps(dup_indices),
            affected_count=dup_count,
            description=f"Found {dup_count} duplicate rows ({round(dup_count/len(df)*100, 1)}%)",
            status="open",
        )
        db.add(issue)
        await db.flush()

        suggestion = RepairSuggestion(
            issue_id=issue.id,
            strategy="deduplicate",
            description="Remove duplicate rows, keeping the first occurrence",
            confidence=0.95,
            is_recommended=True,
            preview_before=json.dumps({"duplicate_count": dup_count}),
            preview_after=json.dumps({"rows_after": len(df) - dup_count + len(df[~dup_mask.duplicated(keep="first")])}),
        )
        db.add(suggestion)
        issues.append(issue)

    return issues


async def _detect_outliers(
    dataset_id: str, run_id: str, df: pd.DataFrame, db: AsyncSession
) -> list[DetectedIssue]:
    issues = []
    numeric_cols = df.select_dtypes(include=[np.number]).columns

    for col in numeric_cols:
        series = df[col].dropna()
        if len(series) < 10:
            continue

        lower, upper = compute_iqr_bounds(series)
        outlier_mask = (df[col] < lower) | (df[col] > upper)
        outlier_count = int(outlier_mask.sum())

        if outlier_count == 0:
            continue

        outlier_indices = df.index[outlier_mask].tolist()[:50]
        outlier_values = df.loc[outlier_mask, col].head(5).tolist()

        issue = DetectedIssue(
            validation_run_id=run_id,
            dataset_id=dataset_id,
            issue_type="outlier",
            severity="warning",
            column_name=col,
            affected_rows=json.dumps(outlier_indices),
            affected_count=outlier_count,
            description=f"Column '{col}' has {outlier_count} outliers outside IQR bounds [{lower:.2f}, {upper:.2f}]",
            current_value_sample=json.dumps([str(v) for v in outlier_values]),
            expected_value=f"Values between {lower:.2f} and {upper:.2f}",
            status="open",
        )
        db.add(issue)
        await db.flush()

        clip_suggestion = RepairSuggestion(
            issue_id=issue.id,
            strategy="clip_outlier",
            description=f"Clip values to IQR bounds [{lower:.2f}, {upper:.2f}]",
            confidence=0.85,
            is_recommended=True,
        )
        remove_suggestion = RepairSuggestion(
            issue_id=issue.id,
            strategy="remove_outlier_rows",
            description=f"Remove {outlier_count} rows containing outliers",
            confidence=0.60,
            is_recommended=False,
        )
        db.add(clip_suggestion)
        db.add(remove_suggestion)
        issues.append(issue)

    return issues


async def _detect_type_mismatches(
    dataset_id: str, run_id: str, df: pd.DataFrame, db: AsyncSession
) -> list[DetectedIssue]:
    issues = []
    for col in df.columns:
        series = df[col].dropna()
        if len(series) == 0:
            continue

        if pd.api.types.is_numeric_dtype(series):
            continue

        sample = series.astype(str).head(200)
        numeric_count = sample.apply(_is_numeric).sum()
        non_numeric_count = len(sample) - numeric_count

        if numeric_count > len(sample) * 0.5 and non_numeric_count > 0 and non_numeric_count < len(sample) * 0.3:
            bad_indices = df.index[
                df[col].notna() & ~df[col].astype(str).apply(_is_numeric)
            ].tolist()[:50]
            bad_count = int(
                (df[col].notna() & ~df[col].astype(str).apply(_is_numeric)).sum()
            )

            if bad_count > 0:
                issue = DetectedIssue(
                    validation_run_id=run_id,
                    dataset_id=dataset_id,
                    issue_type="type_mismatch",
                    severity="warning",
                    column_name=col,
                    affected_rows=json.dumps(bad_indices),
                    affected_count=bad_count,
                    description=f"Column '{col}' appears numeric but has {bad_count} non-numeric values",
                    status="open",
                )
                db.add(issue)
                await db.flush()

                suggestion = RepairSuggestion(
                    issue_id=issue.id,
                    strategy="coerce_type",
                    description=f"Convert column to numeric, replacing non-numeric values with NaN",
                    confidence=0.75,
                    is_recommended=True,
                )
                db.add(suggestion)
                issues.append(issue)

    return issues


def _is_numeric(val: str) -> bool:
    try:
        float(str(val).replace(",", "").strip())
        return True
    except (ValueError, TypeError):
        return False


async def _suggest_missing_repairs(
    issue: DetectedIssue, series: pd.Series, db: AsyncSession
):
    numeric = pd.to_numeric(series, errors="coerce")
    is_numeric = numeric.notna().sum() > series.notna().sum() * 0.5

    if is_numeric:
        non_null = numeric.dropna()
        if len(non_null) > 0:
            mean_val = round(float(non_null.mean()), 2)
            median_val = round(float(non_null.median()), 2)

            db.add(RepairSuggestion(
                issue_id=issue.id,
                strategy="mean_imputation",
                description=f"Fill missing values with mean ({mean_val})",
                confidence=0.80,
                is_recommended=False,
                preview_after=json.dumps({"fill_value": mean_val}),
            ))
            db.add(RepairSuggestion(
                issue_id=issue.id,
                strategy="median_imputation",
                description=f"Fill missing values with median ({median_val})",
                confidence=0.85,
                is_recommended=True,
                preview_after=json.dumps({"fill_value": median_val}),
            ))
    else:
        mode_val = series.mode()
        if len(mode_val) > 0:
            db.add(RepairSuggestion(
                issue_id=issue.id,
                strategy="mode_imputation",
                description=f"Fill missing values with most common value ('{mode_val.iloc[0]}')",
                confidence=0.70,
                is_recommended=True,
                preview_after=json.dumps({"fill_value": str(mode_val.iloc[0])}),
            ))

    db.add(RepairSuggestion(
        issue_id=issue.id,
        strategy="drop_rows",
        description=f"Remove rows with missing values in this column",
        confidence=0.50,
        is_recommended=False,
    ))
