import uuid
from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Float, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from app.database import Base


class ProfileBaseline(Base):
    __tablename__ = "profile_baselines"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_id: Mapped[str] = mapped_column(String(36), ForeignKey("datasets.id"), nullable=False, index=True)
    column_name: Mapped[str] = mapped_column(String(255), nullable=False)
    baseline_stats: Mapped[str] = mapped_column(Text, nullable=False)  # JSON
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())


class DriftReport(Base):
    __tablename__ = "drift_reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_id: Mapped[str] = mapped_column(String(36), ForeignKey("datasets.id"), nullable=False, index=True)
    drift_type: Mapped[str] = mapped_column(String(50), nullable=False)  # schema|distribution|volume
    severity: Mapped[str] = mapped_column(String(20), nullable=False)    # low|medium|high
    column_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    baseline_value: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON or string
    current_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    drift_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
