from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, JSON

from app.db import Base


class SymptomRule(Base):
    __tablename__ = "symptom_rules"

    id = Column(String(50), primary_key=True)  # e.g., cattle_reduced_feed_v1
    species = Column(String(30), nullable=False, index=True)  # cattle, buffalo, goat, sheep
    symptom_key = Column(String(50), nullable=False, index=True)
    rule_data = Column(JSON, nullable=False)  # questions, options, outcomes, disclaimer
    needs_vet_review = Column(Boolean, default=True, nullable=False)  # PRD safety rule
    is_active = Column(Boolean, default=True, nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
