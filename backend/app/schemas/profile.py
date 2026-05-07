from typing import Any, Optional

from pydantic import BaseModel


class ColumnProfileResponse(BaseModel):
    id: str
    column_name: str
    column_index: int
    detected_type: str
    null_count: int
    null_percentage: float
    unique_count: int
    unique_percentage: float
    duplicate_count: int
    min_value: Optional[str] = None
    max_value: Optional[str] = None
    mean_value: Optional[float] = None
    median_value: Optional[float] = None
    std_dev: Optional[float] = None
    top_values: Optional[Any] = None
    distribution: Optional[Any] = None
    pattern: Optional[str] = None
    is_pii: bool = False
    pii_type: Optional[str] = None
    sample_values: Optional[Any] = None

    model_config = {"from_attributes": True}


class ProfileResponse(BaseModel):
    dataset_id: str
    columns: list[ColumnProfileResponse]
