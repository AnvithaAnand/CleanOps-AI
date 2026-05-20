from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class DatasetResponse(BaseModel):
    id: str
    name: str
    original_filename: str
    file_type: str
    file_size_bytes: int
    row_count: Optional[int] = None
    column_count: Optional[int] = None
    status: str
    trust_score: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DatasetListItem(BaseModel):
    id: str
    name: str
    original_filename: str
    file_type: str
    row_count: Optional[int] = None
    column_count: Optional[int] = None
    status: str
    trust_score: Optional[float] = None
    description: Optional[str] = None
    tags: Optional[str] = None  # JSON string, parsed on frontend
    created_at: datetime

    model_config = {"from_attributes": True}


class DatasetVersionResponse(BaseModel):
    id: str
    version_number: int
    file_path: str
    row_count: int
    change_summary: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class DataPreviewResponse(BaseModel):
    columns: list[str]
    rows: list[dict[str, Any]]
    total_rows: int


class RepairRequest(BaseModel):
    suggestion_ids: list[str]


class RepairResultResponse(BaseModel):
    version_number: int
    repairs_applied: int
    rows_affected: int
    new_trust_score: Optional[float] = None
