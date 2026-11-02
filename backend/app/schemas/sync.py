from datetime import datetime
from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field

from app.schemas.animal import AnimalResponse
from app.schemas.health_event import HealthEventResponse
from app.schemas.reminder import ReminderResponse


class MutationItem(BaseModel):
    id: str = Field(..., description="Unique client mutation tracking ID")
    entity: Literal["animal", "health_event", "reminder"] = Field(..., description="Entity affected")
    action: Literal["create", "update", "delete"] = Field(..., description="Action taken")
    entity_id: str = Field(..., description="Client UUID of the entity")
    data: Dict[str, Any] = Field(default_factory=dict, description="Entity payload")
    client_timestamp: datetime = Field(..., description="When the action was performed on client")


class SyncRequest(BaseModel):
    mutations: List[MutationItem] = Field(default_factory=list, description="Ordered offline mutations")
    last_synced_at: Optional[datetime] = Field(None, description="Client's previous sync watermark")


class SyncDelta(BaseModel):
    animals: List[AnimalResponse] = Field(default_factory=list)
    health_events: List[HealthEventResponse] = Field(default_factory=list)
    reminders: List[ReminderResponse] = Field(default_factory=list)


class SyncResponse(BaseModel):
    status: str
    server_time: datetime
    applied_mutations: int
    delta: SyncDelta
