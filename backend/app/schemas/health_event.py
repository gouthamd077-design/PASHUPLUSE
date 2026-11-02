import uuid
from datetime import date, datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field


class HealthEventBase(BaseModel):
    event_type: Literal[
        "vaccination", "deworming", "illness", "treatment", "insemination", "general"
    ] = Field(..., description="Type of health intervention")
    event_date: date = Field(..., description="Date of the event")
    title: str = Field(..., max_length=150, description="Short summary title")
    notes: Optional[str] = Field(None, description="Detailed observations or treatment notes")
    cost: Optional[float] = Field(None, ge=0, description="Cost in INR")


class HealthEventCreate(HealthEventBase):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), description="Client-generated UUID")
    updated_at: Optional[datetime] = None


class HealthEventResponse(HealthEventBase):
    id: str
    animal_id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    server_updated_at: datetime

    class Config:
        from_attributes = True
