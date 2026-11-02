import random
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.case import Case, ActivityLog
from app.models.animal import Animal
from app.models.user import User
from app.routes.deps import get_current_user

router = APIRouter(prefix="/cases", tags=["Cases & Clinical Workflow"])


class CaseCreateRequest(BaseModel):
    animal_id: str
    symptoms: List[str]
    description: Optional[str] = None
    duration_days: int = 1
    temperature_f: Optional[float] = None
    appetite: str = "reduced"
    photo_url: Optional[str] = None
    location_name: str = "Mandya, Karnataka"
    latitude: Optional[float] = 12.5238
    longitude: Optional[float] = 76.8973
    language: str = "kn"


class AssessmentRequest(BaseModel):
    diagnosis: str
    clinical_notes: Optional[str] = None
    medicines: List[Dict[str, Any]]  # [{name, dosage, frequency, duration_days, instructions}]
    followup_date: Optional[str] = None


class DoseConfirmRequest(BaseModel):
    medicine_name: str
    dose_slot: str  # "Morning" or "Evening"
    actor_name: str = "Caregiver"


class FollowUpRequest(BaseModel):
    improvement_status: str  # "improving", "same", "worse"
    notes: Optional[str] = None
    photo_url: Optional[str] = None


def generate_ai_preliminary_triage(symptoms: List[str], temp_f: Optional[float], duration_days: int) -> Dict[str, Any]:
    """Generates structured preliminary AI triage with explicit safety disclaimers."""
    symptoms_lower = [s.lower() for s in symptoms]
    
    indicators = []
    urgency = "NORMAL"
    risk_level = "MODERATE"

    is_emergency = any("bloat" in s or "chok" in s or "down" in s or "recumbent" in s for s in symptoms_lower)
    is_fever = (temp_f and temp_f >= 103.5) or any("fever" in s or "hot" in s or "ಜ್ವರ" in s for s in symptoms_lower)
    is_fmd = any("mouth" in s or "blister" in s or "saliva" in s or "drool" in s or "ಬಾಯಿ" in s for s in symptoms_lower)
    is_lsd = any("nodule" in s or "skin" in s or "lump" in s or "ಗಂಟು" in s for s in symptoms_lower)
    is_mastitis = any("udder" in s or "milk" in s or "teat" in s or "ಕೆಚ್ಚಲು" in s for s in symptoms_lower)

    if is_emergency:
        urgency = "EMERGENCY"
        risk_level = "CRITICAL"
        indicators.append("Potential Acute Emergency (Bloat / Recumbency)")
    if is_fever:
        indicators.append("Acute Febrile Syndrome (High Body Temperature)")
        if risk_level != "CRITICAL":
            urgency = "URGENT"
            risk_level = "HIGH"
    if is_fmd:
        indicators.append("Possible Vesicular / Foot-and-Mouth Disease signs (FMD Rule-out)")
        urgency = "URGENT"
    if is_lsd:
        indicators.append("Possible Lumpy Skin Disease (LSD) dermatological pattern")
    if is_mastitis:
        indicators.append("Possible Clinical Bovine Mastitis (Udder inflammation)")

    if not indicators:
        indicators.append("General malaise / reduced intake (Non-specific febrile illness)")

    recommendations = [
        "Isolate animal in a clean, shaded, well-ventilated enclosure with dry bedding.",
        "Provide continuous access to cool, clean drinking water with electrolyte solution.",
        "Do not force-feed fibrous green fodder if swallowing is impaired.",
        "Keep animal under continuous observation until attending veterinary officer arrives.",
    ]

    return {
        "status": "TRIAGE_COMPLETE",
        "risk_level": risk_level,
        "urgency": urgency,
        "possible_indicators": indicators,
        "recommended_next_steps": recommendations,
        "disclaimer": "⚠️ PRELIMINARY AI TRIAGE ONLY: This automated evaluation is for preliminary case structuring and veterinary review. It does not constitute a certified diagnosis or prescription.",
    }


@router.post("", summary="Submit a new animal symptom report")
def create_case(
    req: CaseCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    animal = db.query(Animal).filter(Animal.id == req.animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal not found")

    # Generate sequential unique Case ID (e.g. PP-2026-00124)
    rand_suffix = random.randint(100, 999)
    case_num = f"PP-2026-{rand_suffix:05d}"

    ai_triage = generate_ai_preliminary_triage(req.symptoms, req.temperature_f, req.duration_days)

    new_case = Case(
        case_number=case_num,
        animal_id=animal.id,
        farmer_id=current_user.id,
        symptoms=req.symptoms,
        description=req.description,
        duration_days=req.duration_days,
        temperature_f=req.temperature_f,
        appetite=req.appetite,
        photo_url=req.photo_url,
        location_name=req.location_name,
        latitude=req.latitude,
        longitude=req.longitude,
        status="AWAITING_VETERINARIAN",
        urgency=ai_triage["urgency"],
        preliminary_ai_report=ai_triage,
        follow_ups=[],
        dose_confirmations=[],
    )

    db.add(new_case)

    # Log in activity audit
    activity = ActivityLog(
        animal_id=animal.id,
        actor_name=current_user.name or "Farmer",
        actor_role="FARMER",
        action_type="CASE_FILED",
        description=f"Reported symptoms ({', '.join(req.symptoms)}). Case ID {case_num} created and assigned for vet review.",
    )
    db.add(activity)

    db.commit()
    db.refresh(new_case)
    return new_case


@router.get("", summary="Get all cases for current user or vet")
def list_cases(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role in ["veterinarian", "admin"]:
        cases = db.query(Case).order_by(Case.created_at.desc()).all()
    else:
        cases = db.query(Case).filter(Case.farmer_id == current_user.id).order_by(Case.created_at.desc()).all()
    return cases


@router.get("/queue", summary="Veterinarian incoming case queue")
def get_vet_queue(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cases = db.query(Case).filter(
        Case.status.in_(["AWAITING_VETERINARIAN", "ACCEPTED", "ASSESSMENT_IN_PROGRESS", "TREATMENT_PRESCRIBED"])
    ).order_by(Case.created_at.desc()).all()
    return cases


@router.get("/{case_id}", summary="Get detailed case info")
def get_case(case_id: str, db: Session = Depends(get_db)):
    case_obj = db.query(Case).filter((Case.id == case_id) | (Case.case_number == case_id)).first()
    if not case_obj:
        raise HTTPException(status_code=404, detail="Case not found")
    return case_obj


@router.post("/{case_id}/accept", summary="Veterinarian accepts case")
def accept_case(
    case_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    case_obj = db.query(Case).filter((Case.id == case_id) | (Case.case_number == case_id)).first()
    if not case_obj:
        raise HTTPException(status_code=404, detail="Case not found")

    case_obj.vet_id = current_user.id
    case_obj.status = "ACCEPTED"

    activity = ActivityLog(
        animal_id=case_obj.animal_id,
        actor_name=current_user.name or "Dr. Ramesh (Vet)",
        actor_role="VETERINARIAN",
        action_type="VET_ACCEPTED",
        description=f"Case {case_obj.case_number} accepted by attending veterinarian.",
    )
    db.add(activity)

    db.commit()
    db.refresh(case_obj)
    return case_obj


@router.post("/{case_id}/assessment", summary="Veterinarian records diagnosis and issues digital prescription")
def submit_assessment(
    case_id: str,
    req: AssessmentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    case_obj = db.query(Case).filter((Case.id == case_id) | (Case.case_number == case_id)).first()
    if not case_obj:
        raise HTTPException(status_code=404, detail="Case not found")

    case_obj.vet_assessment = {
        "diagnosis": req.diagnosis,
        "clinical_notes": req.clinical_notes,
        "diagnosed_by": current_user.name or "Veterinary Officer",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    case_obj.prescription = {
        "medicines": req.medicines,
        "followup_date": req.followup_date,
        "prescribed_by": current_user.name or "Veterinary Officer",
        "issued_at": datetime.now(timezone.utc).isoformat(),
    }

    case_obj.status = "TREATMENT_PRESCRIBED"

    activity = ActivityLog(
        animal_id=case_obj.animal_id,
        actor_name=current_user.name or "Veterinary Officer",
        actor_role="VETERINARIAN",
        action_type="PRESCRIPTION_ISSUED",
        description=f"Diagnosis: {req.diagnosis}. Digital prescription issued with {len(req.medicines)} prescribed medicines.",
    )
    db.add(activity)

    db.commit()
    db.refresh(case_obj)
    return case_obj


@router.post("/{case_id}/confirm-dose", summary="Log medicine dose administration")
def confirm_dose(
    case_id: str,
    req: DoseConfirmRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    case_obj = db.query(Case).filter((Case.id == case_id) | (Case.case_number == case_id)).first()
    if not case_obj:
        raise HTTPException(status_code=404, detail="Case not found")

    doses = list(case_obj.dose_confirmations or [])
    new_dose = {
        "id": str(uuid.uuid4()),
        "medicine_name": req.medicine_name,
        "dose_slot": req.dose_slot,
        "actor_name": req.actor_name or current_user.name or "Family Member",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    doses.append(new_dose)
    case_obj.dose_confirmations = doses

    activity = ActivityLog(
        animal_id=case_obj.animal_id,
        actor_name=new_dose["actor_name"],
        actor_role="FAMILY",
        action_type="DOSE_ADMINISTERED",
        description=f"Confirmed {req.dose_slot} dose of {req.medicine_name}.",
    )
    db.add(activity)

    db.commit()
    db.refresh(case_obj)
    return {"status": "dose_confirmed", "dose": new_dose}


@router.post("/{case_id}/follow-up", summary="Submit recovery progress update")
def submit_followup(
    case_id: str,
    req: FollowUpRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    case_obj = db.query(Case).filter((Case.id == case_id) | (Case.case_number == case_id)).first()
    if not case_obj:
        raise HTTPException(status_code=404, detail="Case not found")

    followups = list(case_obj.follow_ups or [])
    entry = {
        "id": str(uuid.uuid4()),
        "improvement_status": req.improvement_status,
        "notes": req.notes,
        "photo_url": req.photo_url,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    followups.append(entry)
    case_obj.follow_ups = followups

    if req.improvement_status == "worse":
        case_obj.status = "REASSESSMENT_REQUIRED"
        case_obj.urgency = "URGENT"
    else:
        case_obj.status = "FOLLOW_UP_PENDING"

    activity = ActivityLog(
        animal_id=case_obj.animal_id,
        actor_name=current_user.name or "Farmer",
        actor_role="FARMER",
        action_type="FOLLOWUP_SUBMITTED",
        description=f"Follow-up update submitted. Status: {req.improvement_status}.",
    )
    db.add(activity)

    db.commit()
    db.refresh(case_obj)
    return case_obj


@router.post("/{case_id}/complete", summary="Close case as recovered")
def complete_case(
    case_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    case_obj = db.query(Case).filter((Case.id == case_id) | (Case.case_number == case_id)).first()
    if not case_obj:
        raise HTTPException(status_code=404, detail="Case not found")

    case_obj.status = "COMPLETED"

    activity = ActivityLog(
        animal_id=case_obj.animal_id,
        actor_name=current_user.name or "Veterinary Officer",
        actor_role="VETERINARIAN",
        action_type="CASE_COMPLETED",
        description=f"Case {case_obj.case_number} closed with documented recovery.",
    )
    db.add(activity)

    db.commit()
    db.refresh(case_obj)
    return case_obj
