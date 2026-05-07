from typing import Optional

from pydantic import BaseModel


class TrustScoreDimension(BaseModel):
    name: str
    score: float
    weight: float
    details: Optional[str] = None


class TrustScoreResponse(BaseModel):
    dataset_id: str
    overall_score: float
    dimensions: list[TrustScoreDimension]
