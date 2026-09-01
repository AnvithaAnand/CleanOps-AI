from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.dataset import Dataset

router = APIRouter(prefix="/api/pipeline", tags=["pipeline"])


@router.get("/gate/{dataset_id}")
async def quality_gate(
    dataset_id: str,
    min_trust_score: float = 80.0,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(404, "Dataset not found")

    score = dataset.trust_score
    passed = score is not None and score >= min_trust_score

    body = {
        "dataset_id": dataset_id,
        "dataset_name": dataset.name,
        "trust_score": score,
        "threshold": min_trust_score,
        "passed": passed,
        "status": dataset.status,
        "message": (
            f"PASS — trust score {score:.1f} >= {min_trust_score}"
            if passed
            else f"FAIL — trust score {score if score is not None else 'N/A'} < {min_trust_score}"
        ),
    }

    if not passed:
        raise HTTPException(status_code=424, detail=body)
    return body
