from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class CreateRuleRequest(BaseModel):
    dataset_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    rule_type: str
    column_name: Optional[str] = None
    parameters: dict[str, Any] = {}
    severity: str = "warning"


class UpdateRuleRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    rule_type: Optional[str] = None
    column_name: Optional[str] = None
    parameters: Optional[dict[str, Any]] = None
    severity: Optional[str] = None
    is_active: Optional[bool] = None


class QualityRuleResponse(BaseModel):
    id: str
    dataset_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    rule_type: str
    column_name: Optional[str] = None
    parameters: Any
    severity: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
