import json
import re
from datetime import datetime
from typing import Optional

import pandas as pd
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.rule import QualityRule
from app.models.validation import DetectedIssue, ValidationRun


async def run_validation(
    dataset_id: str,
    df: pd.DataFrame,
    db: AsyncSession,
    rule_ids: Optional[list[str]] = None,
) -> ValidationRun:
    query = select(QualityRule).where(
        (QualityRule.dataset_id == dataset_id) | (QualityRule.dataset_id.is_(None)),
        QualityRule.is_active == True,
    )
    if rule_ids:
        query = query.where(QualityRule.id.in_(rule_ids))

    result = await db.execute(query)
    rules = result.scalars().all()

    run = ValidationRun(
        dataset_id=dataset_id,
        status="running",
        total_rules_checked=len(rules),
    )
    db.add(run)
    await db.flush()

    issues_found = 0
    for rule in rules:
        params = json.loads(rule.parameters) if isinstance(rule.parameters, str) else rule.parameters
        violations = evaluate_rule(df, rule.rule_type, rule.column_name, params)

        if violations:
            issue = DetectedIssue(
                validation_run_id=run.id,
                dataset_id=dataset_id,
                issue_type=f"rule_violation:{rule.rule_type}",
                severity=rule.severity,
                column_name=rule.column_name,
                affected_rows=json.dumps(violations[:50]),
                affected_count=len(violations),
                description=f"Rule '{rule.name}' violated: {len(violations)} rows failed {rule.rule_type} check on column '{rule.column_name}'",
                status="open",
            )
            db.add(issue)
            issues_found += 1

    run.status = "completed"
    run.total_issues_found = issues_found
    run.completed_at = datetime.utcnow()
    await db.flush()

    return run


def evaluate_rule(
    df: pd.DataFrame,
    rule_type: str,
    column_name: Optional[str],
    params: dict,
) -> list[int]:
    if column_name and column_name not in df.columns:
        return []

    evaluators = {
        "not_null": _eval_not_null,
        "unique": _eval_unique,
        "range": _eval_range,
        "regex": _eval_regex,
        "enum": _eval_enum,
        "type_check": _eval_type_check,
        "length": _eval_length,
    }

    evaluator = evaluators.get(rule_type)
    if not evaluator:
        return []

    return evaluator(df, column_name, params)


def _eval_not_null(df: pd.DataFrame, col: str, params: dict) -> list[int]:
    return df.index[df[col].isna()].tolist()


def _eval_unique(df: pd.DataFrame, col: str, params: dict) -> list[int]:
    return df.index[df[col].duplicated(keep=False)].tolist()


def _eval_range(df: pd.DataFrame, col: str, params: dict) -> list[int]:
    series = pd.to_numeric(df[col], errors="coerce")
    mask = pd.Series(False, index=df.index)
    if "min" in params:
        mask |= series < params["min"]
    if "max" in params:
        mask |= series > params["max"]
    mask &= series.notna()
    return df.index[mask].tolist()


def _eval_regex(df: pd.DataFrame, col: str, params: dict) -> list[int]:
    pattern = params.get("pattern", "")
    if not pattern:
        return []
    series = df[col].astype(str)
    mask = ~series.str.match(pattern, na=False) & df[col].notna()
    return df.index[mask].tolist()


def _eval_enum(df: pd.DataFrame, col: str, params: dict) -> list[int]:
    allowed = params.get("values", [])
    if not allowed:
        return []
    mask = ~df[col].isin(allowed) & df[col].notna()
    return df.index[mask].tolist()


def _eval_type_check(df: pd.DataFrame, col: str, params: dict) -> list[int]:
    expected = params.get("type", "string")
    if expected in ("integer", "float", "numeric"):
        numeric = pd.to_numeric(df[col], errors="coerce")
        mask = numeric.isna() & df[col].notna()
        return df.index[mask].tolist()
    if expected == "datetime":
        dates = pd.to_datetime(df[col], errors="coerce")
        mask = dates.isna() & df[col].notna()
        return df.index[mask].tolist()
    return []


def _eval_length(df: pd.DataFrame, col: str, params: dict) -> list[int]:
    lengths = df[col].astype(str).str.len()
    mask = pd.Series(False, index=df.index)
    if "min" in params:
        mask |= lengths < params["min"]
    if "max" in params:
        mask |= lengths > params["max"]
    mask &= df[col].notna()
    return df.index[mask].tolist()
