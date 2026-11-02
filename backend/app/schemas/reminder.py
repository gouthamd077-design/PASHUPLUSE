import uuid
from datetime import date, datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field


class ReminderBase(BaseModel):
    title: str = Field(..., max_length=150, description="Reminder title (e.g. FMD Booster)")
    due_date: date = Field(..., description="Due date")
    reminder_type: Literal["vaccine", "deworm", "checkup", "general"] = Field("general", description="Category")
    animal_id: Optional[str] = Field(None, description="Optional linked animal ID")


class ReminderCreate(ReminderBase):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), description="Client-generated UUID")
    updated_at: Optional[datetime] = None


class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    due_date: Optional[date] = None
    reminder_type: Optional[Literal["vaccine", "deworm", "checkup", "general"]] = None
    is_done: Optional[bool] = None


class ReminderResponse(ReminderBase):
    id: str
    user_id: str
    is_done: bool
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    server_updated_at: datetime

    class Config:
        from_attributes = True
