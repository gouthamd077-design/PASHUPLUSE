import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.db import Base


class HealthEvent(Base):
    __tablename__ = "health_events"

    # Client-generated UUID for offline idempotency
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    animal_id = Column(String(36), ForeignKey("animals.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(30), nullable=False)  # vaccination, deworming, illness, treatment, insemination, other
    event_date = Column(Date, nullable=False, index=True)
    title = Column(String(150), nullable=False)
    notes = Column(Text, nullable=True)
    cost = Column(Float, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    server_updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    animal = relationship("Animal", back_populates="health_events")
