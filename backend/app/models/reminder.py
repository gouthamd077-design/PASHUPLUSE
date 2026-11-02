import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship

from app.db import Base


class Reminder(Base):
    __tablename__ = "reminders"

    # Client-generated UUID for offline idempotency
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    animal_id = Column(String(36), ForeignKey("animals.id", ondelete="CASCADE"), nullable=True, index=True)
    title = Column(String(150), nullable=False)
    due_date = Column(Date, nullable=False, index=True)
    is_done = Column(Boolean, default=False, nullable=False, index=True)
    completed_at = Column(DateTime, nullable=True)
    reminder_type = Column(String(30), default="general", nullable=False)  # vaccine, deworm, checkup, general

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    server_updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="reminders")
    animal = relationship("Animal", back_populates="reminders")
