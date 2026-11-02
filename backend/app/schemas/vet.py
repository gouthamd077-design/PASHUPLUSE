from typing import Optional
from pydantic import BaseModel


class VetResponse(BaseModel):
    id: int
    name: str
    role: str
    phone: str
    district: str
    sub_district: Optional[str] = None
    specialization: Optional[str] = None
    is_verified: bool

    class Config:
        from_attributes = True
