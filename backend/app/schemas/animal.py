import uuid
from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field


class AnimalBase(BaseModel):
    tag_id: str = Field(..., max_length=50, description="Ear tag or identifier")
    name: Optional[str] = Field(None, max_length=100)
    species: Literal["cattle", "buffalo", "goat", "sheep"] = Field(..., description="Species of livestock")
    breed: Optional[str] = Field(None, max_length=100)
    gender: Literal["female", "male"] = Field(..., description="Gender")
    age_months: Optional[int] = Field(None, ge=0, le=360, description="Age in months")
    photo_url: Optional[str] = Field(None, description="Optional photo URL or local base64")


class AnimalCreate(AnimalBase):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), description="Client-generated UUID")
    updated_at: Optional[datetime] = None


class AnimalUpdate(BaseModel):
    tag_id: Optional[str] = Field(None, max_length=50)
    name: Optional[str] = Field(None, max_length=100)
    species: Optional[Literal["cattle", "buffalo", "goat", "sheep"]] = None
    breed: Optional[str] = Field(None, max_length=100)
    gender: Optional[Literal["female", "male"]] = None
    age_months: Optional[int] = Field(None, ge=0, le=360)
    photo_url: Optional[str] = None
    status: Optional[Literal["active", "archived", "sold", "deceased"]] = None
    updated_at: Optional[datetime] = None


class AnimalResponse(AnimalBase):
    id: str
    user_id: str
    status: str
    created_at: datetime
    updated_at: datetime
    server_updated_at: datetime

    class Config:
        from_attributes = True
