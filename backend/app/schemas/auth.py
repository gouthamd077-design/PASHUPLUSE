import re
from typing import Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict


def normalize_indian_phone(v: str) -> str:
    cleaned = re.sub(r"[\s\-\(\)]", "", v)
    if cleaned.startswith("+91"):
        cleaned = cleaned[3:]
    elif cleaned.startswith("91") and len(cleaned) == 12:
        cleaned = cleaned[2:]
    if not re.match(r"^[6-9]\d{9}$", cleaned):
        raise ValueError("Must be a valid 10-digit Indian mobile number (e.g. 9876543210)")
    return cleaned


class OTPRequest(BaseModel):
    phone: str = Field(..., description="Indian mobile number (10 digits, or with +91)")

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return normalize_indian_phone(v)


class OTPVerify(BaseModel):
    phone: str = Field(..., description="Indian mobile number (10 digits, or with +91)")
    otp: str = Field(..., min_length=4, max_length=6, description="Verification code")
    role: Optional[str] = "farmer"  # farmer, veterinarian, admin

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return normalize_indian_phone(v)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    phone: str
    role: str = "farmer"
    name: Optional[str] = None


class RoleSwitchRequest(BaseModel):
    role: str  # farmer, veterinarian, admin
    name: Optional[str] = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    phone: str
    name: Optional[str] = None
    role: str
    language_pref: str
