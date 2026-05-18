import uuid
from datetime import datetime
from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from app.database import Base


class DataContract(Base):
    __tablename__ = "data_contracts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_id: Mapped[str] = mapped_column(String(36), ForeignKey("datasets.id"), nullable=False, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, default="Data Contract")
    schema_definition: Mapped[str | None] = mapped_column(Text, nullable=True)   # JSON: [{name, type, required}]
    freshness_sla_hours: Mapped[int | None] = mapped_column(Integer, nullable=True)
    min_trust_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    max_null_percentage: Mapped[float | None] = mapped_column(Float, nullable=True)
    min_row_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
