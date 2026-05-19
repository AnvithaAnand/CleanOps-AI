import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class WebhookEndpoint(Base):
    __tablename__ = "webhook_endpoints"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    url: Mapped[str] = mapped_column(String(1000), nullable=False)
    events: Mapped[str] = mapped_column(Text, nullable=False, default="[]")  # JSON list
    secret: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
