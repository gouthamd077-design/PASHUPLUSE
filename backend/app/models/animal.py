import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.db import Base


class Animal(Base):
    __tablename__ = "animals"

    # Client-generated UUID for offline idempotency
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    tag_id = Column(String(50), nullable=False, index=True)
    name = Column(String(100), nullable=True)
    species = Column(String(30), nullable=False, index=True)  # cattle, buffalo, goat, sheep
    breed = Column(String(100), nullable=True)
    gender = Column(String(10), nullable=False)  # female, male
    age_months = Column(Integer, nullable=True)
    photo_url = Column(String(255), nullable=True)
    status = Column(String(20), default="active", nullable=False, index=True)  # active, archived, sold, deceased

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    server_updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    owner = relationship("User", back_populates="animals")
    health_events = relationship("HealthEvent", back_populates="animal", cascade="all, delete-orphan", order_by="desc(HealthEvent.event_date)")
    reminders = relationship("Reminder", back_populates="animal", cascade="all, delete-orphan")
