import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.case import SOSRequest, ActivityLog
from app.models.user import User
from app.routes.deps import get_current_user

router = APIRouter(prefix="/sos", tags=["Pashu SOS Emergency"])


class SOSTriggerRequest(BaseModel):
    animal_id: str
    category: str  # "Severe Bloat", "Calving Emergency", "Recumbency & High Fever", "Choking / Injury"
    location: str = "Mandya / Mysuru, Karnataka"


@router.post("/trigger", summary="Trigger Pashu SOS emergency alert")
def trigger_sos(
    req: SOSTriggerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    deadline = datetime.now(timezone.utc) + timedelta(minutes=15)
    sos = SOSRequest(
        id=str(uuid.uuid4()),
        animal_id=req.animal_id,
        farmer_id=current_user.id,
        category=req.category,
        location=req.location,
        status="TRIGGERED",
        escalation_deadline=deadline,
    )
    db.add(sos)

    activity = ActivityLog(
        animal_id=req.animal_id,
        actor_name=current_user.name or "Farmer",
        actor_role="FARMER",
        action_type="SOS_TRIGGERED",
        description=f"CRITICAL SOS: {req.category} reported. Emergency 15-minute dispatch initiated.",
    )
    db.add(activity)

    db.commit()
    db.refresh(sos)
    return {
        "status": "SOS_TRIGGERED",
        "sos_id": sos.id,
        "escalation_deadline": sos.escalation_deadline.isoformat(),
        "assigned_hotline": "1800-PASHU-PULSE",
        "instructions": "Keep the animal safe. Nearest emergency veterinary officer notified.",
    }


@router.get("/active", summary="Get active SOS alerts")
def get_active_sos(db: Session = Depends(get_db)):
    alerts = db.query(SOSRequest).filter(SOSRequest.status.in_(["TRIGGERED", "ESCALATED"])).order_by(SOSRequest.created_at.desc()).all()
    return alerts


@router.post("/{sos_id}/accept", summary="Vet accepts SOS emergency")
def accept_sos(
    sos_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sos = db.query(SOSRequest).filter(SOSRequest.id == sos_id).first()
    if not sos:
        raise HTTPException(status_code=404, detail="SOS not found")
    sos.status = "ACCEPTED"
    sos.vet_id = current_user.id
    db.commit()
    return {"status": "ACCEPTED", "vet_id": current_user.id}


@router.post("/{sos_id}/resolve", summary="Resolve SOS emergency")
def resolve_sos(sos_id: str, db: Session = Depends(get_db)):
    sos = db.query(SOSRequest).filter(SOSRequest.id == sos_id).first()
    if not sos:
        raise HTTPException(status_code=404, detail="SOS not found")
    sos.status = "RESOLVED"
    db.commit()
    return {"status": "RESOLVED"}
