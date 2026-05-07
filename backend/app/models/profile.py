import uuid
from typing import Optional

from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ColumnProfile(Base):
    __tablename__ = "column_profiles"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    dataset_id: Mapped[str] = mapped_column(String(36), ForeignKey("datasets.id"), nullable=False, index=True)
    column_name: Mapped[str] = mapped_column(String(255), nullable=False)
    column_index: Mapped[int] = mapped_column(Integer, nullable=False)
    detected_type: Mapped[str] = mapped_column(String(50), nullable=False)
    null_count: Mapped[int] = mapped_column(Integer, default=0)
    null_percentage: Mapped[float] = mapped_column(Float, default=0.0)
    unique_count: Mapped[int] = mapped_column(Integer, default=0)
    unique_percentage: Mapped[float] = mapped_column(Float, default=0.0)
    duplicate_count: Mapped[int] = mapped_column(Integer, default=0)
    min_value: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    max_value: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    mean_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    median_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    std_dev: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    top_values: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    distribution: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pattern: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_pii: Mapped[bool] = mapped_column(Boolean, default=False)
    pii_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    sample_values: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    dataset: Mapped["Dataset"] = relationship(back_populates="column_profiles")


from app.models.dataset import Dataset  # noqa: E402
