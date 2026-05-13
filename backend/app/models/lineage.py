import uuid
from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from app.database import Base


class LineageNode(Base):
    __tablename__ = "lineage_nodes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_id: Mapped[str] = mapped_column(String(36), ForeignKey("datasets.id"), nullable=False, index=True)
    node_type: Mapped[str] = mapped_column(String(50), nullable=False)  # upload|profile|issues|repair|version
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    entity_id: Mapped[str | None] = mapped_column(String(36), nullable=True)  # job_id, version_id, etc.
    metadata_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())


class LineageEdge(Base):
    __tablename__ = "lineage_edges"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_node_id: Mapped[str] = mapped_column(String(36), ForeignKey("lineage_nodes.id"), nullable=False, index=True)
    target_node_id: Mapped[str] = mapped_column(String(36), ForeignKey("lineage_nodes.id"), nullable=False)
    edge_type: Mapped[str] = mapped_column(String(50), nullable=False)  # processed_by|detected|repaired|versioned
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
