import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.case import FamilyMember, ActivityLog
from app.models.animal import Animal
from app.models.user import User
from app.routes.deps import get_current_user

router = APIRouter(prefix="/family", tags=["Pashu Family Caregivers"])


class AddMemberRequest(BaseModel):
    name: str
    phone: str
    role: str = "CARETAKER"  # OWNER, CARETAKER, VIEWER


class AddLogRequest(BaseModel):
    action_type: str
    description: str


@router.get("/{animal_id}", summary="Get caregivers and activity audit for an animal")
def get_family_data(
    animal_id: str,
    db: Session = Depends(get_db),
):
    members = db.query(FamilyMember).filter(FamilyMember.animal_id == animal_id).all()
    logs = db.query(ActivityLog).filter(ActivityLog.animal_id == animal_id).order_by(ActivityLog.created_at.desc()).all()
    return {
        "members": members,
        "timeline": logs,
    }


@router.post("/{animal_id}/members", summary="Add a family caregiver")
def add_family_member(
    animal_id: str,
    req: AddMemberRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    animal = db.query(Animal).filter(Animal.id == animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal not found")

    member = FamilyMember(
        id=str(uuid.uuid4()),
        animal_id=animal_id,
        name=req.name,
        phone=req.phone,
        role=req.role,
    )
    db.add(member)

    log = ActivityLog(
        animal_id=animal_id,
        actor_name=current_user.name or "Owner",
        actor_role="OWNER",
        action_type="MEMBER_ADDED",
        description=f"Added family caregiver {req.name} ({req.role}) to manage herd care.",
    )
    db.add(log)

    db.commit()
    db.refresh(member)
    return member


@router.post("/{animal_id}/logs", summary="Add manual care activity log")
def add_activity_log(
    animal_id: str,
    req: AddLogRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    log = ActivityLog(
        animal_id=animal_id,
        actor_name=current_user.name or "Family Caregiver",
        actor_role="CARETAKER",
        action_type=req.action_type,
        description=req.description,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
