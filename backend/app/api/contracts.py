import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.dataset import Dataset
from app.models.profile import ColumnProfile
from app.services.contract_service import get_contract, upsert_contract, validate_contract

router = APIRouter(prefix="/api/datasets", tags=["contracts"])


class SchemaColumn(BaseModel):
    name: str
    type: Optional[str] = None
    required: bool = True


class ContractUpsert(BaseModel):
    name: Optional[str] = None
    schema_definition: Optional[list[SchemaColumn]] = None
    freshness_sla_hours: Optional[int] = None
    min_trust_score: Optional[float] = None
    max_null_percentage: Optional[float] = None
    min_row_count: Optional[int] = None


def _contract_to_dict(c) -> dict:
    schema = None
    if c.schema_definition:
        try:
            schema = json.loads(c.schema_definition)
        except Exception:
            schema = c.schema_definition
    return {
        "id": c.id,
        "dataset_id": c.dataset_id,
        "name": c.name,
        "schema_definition": schema,
        "freshness_sla_hours": c.freshness_sla_hours,
        "min_trust_score": c.min_trust_score,
        "max_null_percentage": c.max_null_percentage,
        "min_row_count": c.min_row_count,
        "created_at": c.created_at.isoformat(),
        "updated_at": c.updated_at.isoformat(),
    }


@router.get("/{dataset_id}/contract")
async def get_dataset_contract(dataset_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    if not result.scalar_one_or_none():
        raise HTTPException(404, "Dataset not found")
    contract = await get_contract(db, dataset_id)
    if not contract:
        return None
    return _contract_to_dict(contract)


@router.post("/{dataset_id}/contract")
async def upsert_dataset_contract(
    dataset_id: str,
    body: ContractUpsert,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    if not result.scalar_one_or_none():
        raise HTTPException(404, "Dataset not found")

    schema_json = None
    if body.schema_definition is not None:
        schema_json = json.dumps([c.model_dump() for c in body.schema_definition])

    kwargs = {k: v for k, v in {
        "name": body.name,
        "schema_definition": schema_json,
        "freshness_sla_hours": body.freshness_sla_hours,
        "min_trust_score": body.min_trust_score,
        "max_null_percentage": body.max_null_percentage,
        "min_row_count": body.min_row_count,
    }.items() if v is not None}

    contract = await upsert_contract(db, dataset_id, **kwargs)
    await db.commit()
    return _contract_to_dict(contract)


@router.delete("/{dataset_id}/contract")
async def delete_dataset_contract(dataset_id: str, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import delete
    from app.models.contract import DataContract
    await db.execute(delete(DataContract).where(DataContract.dataset_id == dataset_id))
    await db.commit()
    return {"status": "deleted"}


@router.post("/{dataset_id}/contract/validate")
async def run_contract_validation(dataset_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(404, "Dataset not found")

    result = await db.execute(
        select(ColumnProfile).where(ColumnProfile.dataset_id == dataset_id)
    )
    profiles = result.scalars().all()

    violations = await validate_contract(
        db, dataset_id,
        trust_score=dataset.trust_score or 0,
        profiles=profiles,
        row_count=dataset.row_count or 0,
    )
    await db.commit()
    return {"violations": violations, "passed": len(violations) == 0}
