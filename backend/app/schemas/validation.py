from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class ValidateRequest(BaseModel):
    rule_ids: Optional[list[str]] = None


class IssueResponse(BaseModel):
    id: str
    issue_type: str
    severity: str
    column_name: Optional[str] = None
    affected_count: int
    description: str
    current_value_sample: Optional[str] = None
    expected_value: Optional[str] = None
    status: str
    repair_suggestions: list["RepairSuggestionResponse"] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class IssuesListResponse(BaseModel):
    dataset_id: str
    total: int
    issues: list[IssueResponse]


class ValidationRunResponse(BaseModel):
    id: str
    dataset_id: str
    status: str
    total_rules_checked: int
    total_issues_found: int
    started_at: datetime
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class RepairSuggestionResponse(BaseModel):
    id: str
    strategy: str
    description: str
    preview_before: Optional[Any] = None
    preview_after: Optional[Any] = None
    confidence: float
    is_recommended: bool

    model_config = {"from_attributes": True}
