from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: str
    dataset_id: str
    action: str
    description: str
    before_snapshot: Optional[Any] = None
    after_snapshot: Optional[Any] = None
    metadata_json: Optional[Any] = None
    created_at: datetime

    model_config = {"from_attributes": True}
