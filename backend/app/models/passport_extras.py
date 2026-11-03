import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text, Boolean
from app.db import Base


class TemperatureLog(Base):
    """Specific recorded body temperature readings over time."""
    __tablename__ = "temperature_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    animal_id = Column(String(36), ForeignKey("animals.id", ondelete="CASCADE"), nullable=False, index=True)
    recorded_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    temperature_f = Column(Float, nullable=False)
    is_fever = Column(Boolean, default=False, nullable=False)
    notes = Column(Text, nullable=True)
    recorded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)


class VaccinationRecord(Base):
    """Vaccination records and next due schedules."""
    __tablename__ = "vaccinations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    animal_id = Column(String(36), ForeignKey("animals.id", ondelete="CASCADE"), nullable=False, index=True)
    vaccine_name = Column(String(100), nullable=False)
    batch_number = Column(String(50), nullable=True)
    administered_by_vet = Column(String(100), nullable=True)
    date_administered = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    next_due_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)


class PassportAuditLog(Base):
    """Audit log recording each time a user/vet opens an animal passport."""
    __tablename__ = "passport_audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    animal_id = Column(String(36), ForeignKey("animals.id", ondelete="CASCADE"), nullable=False, index=True)
    viewer_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    viewer_role = Column(String(30), nullable=False)  # owner, family, veterinarian, public, anonymous
    viewer_name = Column(String(100), nullable=True)
    access_level = Column(String(20), nullable=False)  # FULL, MINIMAL
    ip_address = Column(String(45), nullable=True)
    accessed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
