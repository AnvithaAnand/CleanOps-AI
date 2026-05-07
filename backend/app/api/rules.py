import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.rule import QualityRule
from app.schemas.rule import CreateRuleRequest, QualityRuleResponse, UpdateRuleRequest

router = APIRouter(prefix="/api/rules", tags=["rules"])


@router.post("/", response_model=QualityRuleResponse, status_code=201)
async def create_rule(
    body: CreateRuleRequest,
    db: AsyncSession = Depends(get_db),
):
    rule = QualityRule(
        dataset_id=body.dataset_id,
        name=body.name,
        description=body.description,
        rule_type=body.rule_type,
        column_name=body.column_name,
        parameters=json.dumps(body.parameters),
        severity=body.severity,
    )
    db.add(rule)
    await db.flush()

    resp = QualityRuleResponse.model_validate(rule)
    if isinstance(resp.parameters, str):
        try:
            resp.parameters = json.loads(resp.parameters)
        except Exception:
            pass
    return resp


@router.get("/", response_model=list[QualityRuleResponse])
async def list_rules(
    dataset_id: Optional[str] = Query(None),
    rule_type: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(QualityRule).where(QualityRule.is_active == True)
    if dataset_id:
        query = query.where(
            (QualityRule.dataset_id == dataset_id) | (QualityRule.dataset_id.is_(None))
        )
    if rule_type:
        query = query.where(QualityRule.rule_type == rule_type)

    query = query.order_by(QualityRule.created_at.desc())
    result = await db.execute(query)
    rules = result.scalars().all()

    responses = []
    for rule in rules:
        resp = QualityRuleResponse.model_validate(rule)
        if isinstance(resp.parameters, str):
            try:
                resp.parameters = json.loads(resp.parameters)
            except Exception:
                pass
        responses.append(resp)
    return responses


@router.put("/{rule_id}", response_model=QualityRuleResponse)
async def update_rule(
    rule_id: str,
    body: UpdateRuleRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(QualityRule).where(QualityRule.id == rule_id)
    )
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(404, "Rule not found")

    if body.name is not None:
        rule.name = body.name
    if body.description is not None:
        rule.description = body.description
    if body.rule_type is not None:
        rule.rule_type = body.rule_type
    if body.column_name is not None:
        rule.column_name = body.column_name
    if body.parameters is not None:
        rule.parameters = json.dumps(body.parameters)
    if body.severity is not None:
        rule.severity = body.severity
    if body.is_active is not None:
        rule.is_active = body.is_active

    await db.flush()

    resp = QualityRuleResponse.model_validate(rule)
    if isinstance(resp.parameters, str):
        try:
            resp.parameters = json.loads(resp.parameters)
        except Exception:
            pass
    return resp


@router.delete("/{rule_id}", status_code=204)
async def delete_rule(
    rule_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(QualityRule).where(QualityRule.id == rule_id)
    )
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(404, "Rule not found")

    await db.delete(rule)
