import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, JSON, Boolean, ForeignKey
from app.db import Base


class Case(Base):
    __tablename__ = "cases"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_number = Column(String(30), unique=True, index=True, nullable=False)
    animal_id = Column(String(36), ForeignKey("animals.id", ondelete="CASCADE"), nullable=False, index=True)
    farmer_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    vet_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    symptoms = Column(JSON, default=list, nullable=False)
    description = Column(Text, nullable=True)
    duration_days = Column(Integer, default=1, nullable=False)
    temperature_f = Column(Float, nullable=True)
    appetite = Column(String(20), default="reduced", nullable=False)
    photo_url = Column(String(500), nullable=True)
    location_name = Column(String(100), default="Mandya, Karnataka", nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    status = Column(String(30), default="SUBMITTED", nullable=False, index=True)
    urgency = Column(String(20), default="NORMAL", nullable=False)

    preliminary_ai_report = Column(JSON, nullable=True)
    vet_assessment = Column(JSON, nullable=True)
    prescription = Column(JSON, nullable=True)
    follow_ups = Column(JSON, default=list, nullable=False)
    dose_confirmations = Column(JSON, default=list, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class SOSRequest(Base):
    __tablename__ = "sos_requests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    animal_id = Column(String(36), nullable=False, index=True)
    farmer_id = Column(String(36), nullable=False, index=True)
    category = Column(String(50), nullable=False)
    location = Column(String(100), default="Mandya / Mysuru, Karnataka", nullable=False)
    status = Column(String(20), default="TRIGGERED", nullable=False)
    vet_id = Column(String(36), nullable=True)
    escalation_deadline = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class VillageCluster(Base):
    __tablename__ = "village_clusters"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    village_name = Column(String(100), nullable=False)
    district = Column(String(50), default="Mandya", nullable=False)
    disease_name = Column(String(100), nullable=False)
    cases_count = Column(Integer, default=1, nullable=False)
    status = Column(String(30), default="SUSPECTED", nullable=False)  # SUSPECTED, UNDER_VERIFICATION, CONFIRMED
    risk_level = Column(String(20), default="MEDIUM", nullable=False)  # WATCH, MEDIUM, HIGH
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    alert_message_kannada = Column(Text, nullable=True)
    alert_message_english = Column(Text, nullable=True)
    is_synthetic = Column(Boolean, default=True, nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class FamilyMember(Base):
    __tablename__ = "family_members"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    animal_id = Column(String(36), ForeignKey("animals.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(15), nullable=False)
    role = Column(String(20), default="CARETAKER", nullable=False)  # OWNER, CARETAKER, VIEWER
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    animal_id = Column(String(36), ForeignKey("animals.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_name = Column(String(100), nullable=False)
    actor_role = Column(String(20), nullable=False)
    action_type = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
