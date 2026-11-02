from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.user import User
from app.schemas.auth import OTPRequest, OTPVerify, TokenResponse, UserResponse, RoleSwitchRequest
from app.services.auth_service import generate_otp, verify_otp_code, create_access_token
from app.routes.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/request-otp", summary="Info for request-otp endpoint")
def request_otp_info():
    """Information handler preventing 405 Method Not Allowed on browser GET."""
    return {
        "endpoint": "/auth/request-otp",
        "method": "POST",
        "description": "Send a POST request with JSON body {'phone': '9845012345'}",
        "example_curl": "curl -X POST -H 'Content-Type: application/json' -d '{\"phone\":\"9845012345\"}' http://localhost:8000/auth/request-otp",
    }


@router.post("/request-otp", summary="Request OTP for phone number")
def request_otp(data: OTPRequest):
    """Sends a 4-digit OTP to the specified mobile number (logged in console in dev)."""
    otp = generate_otp(data.phone)
    return {
        "status": "otp_sent",
        "message": "OTP generated successfully",
        "phone": data.phone,
        "dev_otp": otp,  # Included for seamless local dev & testing
    }


@router.get("/verify-otp", summary="Info for verify-otp endpoint")
def verify_otp_info():
    """Information handler preventing 405 Method Not Allowed on browser GET."""
    return {
        "endpoint": "/auth/verify-otp",
        "method": "POST",
        "description": "Send a POST request with JSON body {'phone': '9845012345', 'otp': '1234', 'role': 'farmer'}",
    }


@router.post("/verify-otp", response_model=TokenResponse, summary="Verify OTP and receive JWT token")
def verify_otp(data: OTPVerify, db: Session = Depends(get_db)):
    """Verifies the OTP code and creates or returns the user with a 30-day JWT token."""
    if not verify_otp_code(data.phone, data.otp):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code",
        )

    # Find existing user or register new user
    user = db.query(User).filter(User.phone == data.phone).first()
    if not user:
        default_name = "Farmer Daniel Gowda"
        role = data.role or "farmer"
        if role == "veterinarian":
            default_name = "Dr. Ramesh Kumar (Vet)"
        elif role == "admin":
            default_name = "District Admin Officer"

        user = User(phone=data.phone, role=role, name=default_name, language_pref="kn")
        db.add(user)
        db.commit()
        db.refresh(user)
    elif data.role and data.role != user.role:
        user.role = data.role
        db.commit()
        db.refresh(user)

    access_token = create_access_token(data={"sub": user.id, "phone": user.phone, "role": user.role})

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        phone=user.phone,
        role=user.role,
        name=user.name,
    )


@router.post("/switch-role", summary="Switch persona role (Farmer / Vet / Admin) for evaluation demo")
def switch_role(
    data: RoleSwitchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.role = data.role
    if data.name:
        current_user.name = data.name
    elif data.role == "veterinarian":
        current_user.name = "Dr. Ramesh Kumar (Vet Officer, Mandya)"
    elif data.role == "admin":
        current_user.name = "District Admin Officer (Mysuru/Mandya)"
    elif data.role == "farmer":
        current_user.name = "Farmer Daniel Gowda (Mandya)"

    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/me", response_model=UserResponse, summary="Get current logged-in user profile")
def get_me(current_user: User = Depends(get_current_user)):
    """Returns the authenticated user profile."""
    return current_user
