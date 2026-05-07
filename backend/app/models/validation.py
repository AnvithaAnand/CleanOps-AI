import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ValidationRun(Base):
    __tablename__ = "validation_runs"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    dataset_id: Mapped[str] = mapped_column(String(36), ForeignKey("datasets.id"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), default="running")
    total_rules_checked: Mapped[int] = mapped_column(Integer, default=0)
    total_issues_found: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    dataset: Mapped["Dataset"] = relationship(back_populates="validation_runs")
    issues: Mapped[list["DetectedIssue"]] = relationship(
        back_populates="validation_run", cascade="all, delete-orphan"
    )


class DetectedIssue(Base):
    __tablename__ = "detected_issues"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    validation_run_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("validation_runs.id"), nullable=False, index=True
    )
    dataset_id: Mapped[str] = mapped_column(String(36), ForeignKey("datasets.id"), nullable=False, index=True)
    issue_type: Mapped[str] = mapped_column(String(50), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    column_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    affected_rows: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    affected_count: Mapped[int] = mapped_column(Integer, default=1)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    current_value_sample: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    expected_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="open")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    validation_run: Mapped["ValidationRun"] = relationship(back_populates="issues")
    repair_suggestions: Mapped[list["RepairSuggestion"]] = relationship(
        back_populates="issue", cascade="all, delete-orphan"
    )


from app.models.dataset import Dataset  # noqa: E402
from app.models.repair import RepairSuggestion  # noqa: E402
