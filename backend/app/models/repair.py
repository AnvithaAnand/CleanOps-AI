import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class RepairSuggestion(Base):
    __tablename__ = "repair_suggestions"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    issue_id: Mapped[str] = mapped_column(String(36), ForeignKey("detected_issues.id"), nullable=False, index=True)
    strategy: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    preview_before: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    preview_after: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    is_recommended: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    issue: Mapped["DetectedIssue"] = relationship(back_populates="repair_suggestions")


class RepairAction(Base):
    __tablename__ = "repair_actions"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    suggestion_id: Mapped[str] = mapped_column(String(36), ForeignKey("repair_suggestions.id"), nullable=False, index=True)
    dataset_id: Mapped[str] = mapped_column(String(36), ForeignKey("datasets.id"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    rows_affected: Mapped[int] = mapped_column(Integer, default=0)
    applied_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    reverted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)


from app.models.validation import DetectedIssue  # noqa: E402
