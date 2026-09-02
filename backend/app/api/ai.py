import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.dataset import Dataset
from app.models.profile import ColumnProfile
from app.models.repair import RepairAction, RepairSuggestion
from app.models.validation import DetectedIssue
from app.services import ai_service

router = APIRouter(prefix="/api/ai", tags=["ai"])


class NLCommandRequest(BaseModel):
    command: str


@router.get("/{dataset_id}/summary")
async def get_ai_summary(
    dataset_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(404, "Dataset not found")

    result = await db.execute(
        select(ColumnProfile).where(ColumnProfile.dataset_id == dataset_id)
    )
    profiles = result.scalars().all()

    result = await db.execute(
        select(DetectedIssue).where(DetectedIssue.dataset_id == dataset_id)
    )
    issues = result.scalars().all()

    from app.services.trust_score import calculate_trust_score
    score_resp = calculate_trust_score(
        dataset_id, profiles, [i for i in issues if i.status == "open"], dataset.row_count or 0
    )

    pii_cols = [p.column_name for p in profiles if p.is_pii]
    issues_data = [
        {"severity": i.severity, "description": i.description, "issue_type": i.issue_type}
        for i in issues
    ]
    dimensions = [{"name": d.name, "score": d.score} for d in score_resp.dimensions]

    summary = ai_service.explain_dataset(
        dataset_name=dataset.name,
        row_count=dataset.row_count or 0,
        column_count=dataset.column_count or 0,
        trust_score=score_resp.overall_score,
        dimensions=dimensions,
        issues=issues_data,
        pii_columns=pii_cols,
    )
    return summary


@router.get("/{dataset_id}/explain-issues")
async def explain_issues(
    dataset_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(404, "Dataset not found")

    result = await db.execute(
        select(DetectedIssue)
        .where(DetectedIssue.dataset_id == dataset_id, DetectedIssue.status == "open")
    )
    issues = result.scalars().all()

    result = await db.execute(
        select(ColumnProfile).where(ColumnProfile.dataset_id == dataset_id)
    )
    profiles = result.scalars().all()
    profile_map = {p.column_name: p.detected_type for p in profiles}

    explanations = []
    for issue in issues:
        explanation = ai_service.explain_issue(
            issue_type=issue.issue_type,
            column_name=issue.column_name,
            affected_count=issue.affected_count,
            total_rows=dataset.row_count or 1,
            description=issue.description,
            column_type=profile_map.get(issue.column_name or ""),
            dataset_name=dataset.name,
        )
        explanations.append({"issue_id": issue.id, **explanation})

    return {"dataset_id": dataset_id, "explanations": explanations}


@router.post("/{dataset_id}/nl-command")
async def natural_language_command(
    dataset_id: str,
    body: NLCommandRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(404, "Dataset not found")

    result = await db.execute(
        select(ColumnProfile).where(ColumnProfile.dataset_id == dataset_id)
    )
    profiles = result.scalars().all()
    columns = [p.column_name for p in profiles]
    column_types = {p.column_name: p.detected_type for p in profiles}

    parsed = ai_service.parse_nl_command(body.command, columns, column_types)
    return parsed


@router.get("/{dataset_id}/cleaning-code")
async def get_cleaning_code(
    dataset_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(404, "Dataset not found")

    result = await db.execute(
        select(RepairAction).where(RepairAction.dataset_id == dataset_id)
    )
    actions = result.scalars().all()

    result = await db.execute(
        select(ColumnProfile).where(ColumnProfile.dataset_id == dataset_id)
    )
    profiles = result.scalars().all()
    column_types = {p.column_name: p.detected_type for p in profiles}

    repairs = []
    for action in actions:
        result = await db.execute(
            select(RepairSuggestion).where(RepairSuggestion.id == action.suggestion_id)
        )
        suggestion = result.scalar_one_or_none()
        if suggestion:
            result = await db.execute(
                select(DetectedIssue).where(DetectedIssue.id == suggestion.issue_id)
            )
            issue = result.scalar_one_or_none()
            repairs.append({
                "strategy": suggestion.strategy,
                "column": issue.column_name if issue else None,
            })

    if not repairs:
        from app.services.ai_service import _generate_fallback_code
        code = _generate_fallback_code(dataset.name, [])
        return {"pandas_code": code, "explanation": "No repairs applied yet.", "ai_powered": False}

    return ai_service.generate_cleaning_code(dataset.name, repairs, column_types)
