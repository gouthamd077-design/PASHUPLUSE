from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt, JWTError

from app.config import settings

# In-memory OTP store for development mode: {phone: {"otp": "1234", "expires_at": datetime}}
_otp_store: dict = {}


def generate_otp(phone: str) -> str:
    """Generate or retrieve OTP for the given phone number."""
    otp = settings.DEV_MOCK_OTP
    _otp_store[phone] = {
        "otp": otp,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10),
    }
    # Log to console for developer visibility
    print(f"[AUTH DEV] OTP for {phone} is: {otp}")
    return otp


def verify_otp_code(phone: str, entered_otp: str) -> bool:
    """Verify submitted OTP code against active store or dev fallback."""
    # Universal dev code
    if settings.DEBUG and entered_otp == settings.DEV_MOCK_OTP:
        return True

    record = _otp_store.get(phone)
    if not record:
        return False

    if datetime.now(timezone.utc) > record["expires_at"]:
        del _otp_store[phone]
        return False

    if record["otp"] == entered_otp:
        del _otp_store[phone]
        return True

    return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token with user payload."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and validate JWT access token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
