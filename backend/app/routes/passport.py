from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.animal import Animal
from app.models.case import Case, FamilyMember
from app.models.passport_extras import TemperatureLog, VaccinationRecord, PassportAuditLog
from app.models.health_event import HealthEvent
from app.models.user import User
from app.routes.deps import get_current_user_optional, get_current_user

router = APIRouter(prefix="/passport", tags=["Animal Health Passport"])


class TemperatureReadingCreate(BaseModel):
    temperature_f: float = Field(..., ge=90.0, le=115.0, description="Body temperature in Fahrenheit")
    notes: Optional[str] = None


@router.get("/{identifier}", summary="Resolve Animal Health Passport by ID or Tag ID with role-based access control")
def get_animal_health_passport(
    identifier: str,
    request: Request,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    # Lookup by animal ID or tag_id
    clean_id = identifier.strip()
    if clean_id.startswith("/animal/"):
        clean_id = clean_id.replace("/animal/", "")

    animal = (
        db.query(Animal)
        .filter((Animal.id == clean_id) | (Animal.tag_id.ilike(clean_id)))
        .first()
    )

    if not animal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Animal with ID/Tag '{identifier}' was not found in PASHU PULSE database.",
        )

    # Resolve Access Control Level
    has_full_access = False
    viewer_role = "anonymous"
    viewer_name = "Guest User"
    viewer_id = None

    if current_user:
        viewer_id = current_user.id
        viewer_name = current_user.name or current_user.phone
        viewer_role = current_user.role

        # Check Owner
        if animal.user_id == current_user.id:
            has_full_access = True
            viewer_role = "owner"
        # Check Veterinarian / Admin
        elif current_user.role in ("veterinarian", "admin"):
            has_full_access = True
            viewer_role = current_user.role
        else:
            # Check Family member / Caretaker access
            family_record = (
                db.query(FamilyMember)
                .filter(
                    FamilyMember.animal_id == animal.id,
                    FamilyMember.phone == current_user.phone,
                )
                .first()
            )
            if family_record:
                has_full_access = True
                viewer_role = f"family_{family_record.role.lower()}"

    # Audit Logging: Record who opened the passport, which animal, and when
    try:
        audit = PassportAuditLog(
            animal_id=animal.id,
            viewer_id=viewer_id,
            viewer_role=viewer_role,
            viewer_name=viewer_name,
            access_level="FULL" if has_full_access else "MINIMAL",
            ip_address=request.client.host if request.client else None,
            accessed_at=datetime.now(timezone.utc),
        )
        db.add(audit)
        db.commit()
    except Exception as audit_err:
        db.rollback()
        print(f"[AUDIT LOG WARNING] {audit_err}")

    # Determine Owner Details
    owner = db.query(User).filter(User.id == animal.user_id).first()
    owner_name = owner.name if owner else "Mandya Farmer"
    owner_village = "Mandya / Mysuru, Karnataka"

    # Minimal public response if not authorized
    if not has_full_access:
        return {
            "access_level": "MINIMAL",
            "message": "Sign in to view full medical records, temperature logs, and prescriptions.",
            "animal": {
                "id": animal.id,
                "tag_id": animal.tag_id,
                "name": animal.name,
                "species": animal.species,
                "breed": animal.breed,
                "photo_url": animal.photo_url,
                "status": animal.status,
            },
            "owner": {
                "village": owner_village,
            },
            "signed_in": current_user is not None,
            "viewer_role": viewer_role,
        }

    # FULL MEDICAL VIEW (Owner, Authorized Family, Verified Vet)
    # 1. Temperature Logs
    temp_logs = (
        db.query(TemperatureLog)
        .filter(TemperatureLog.animal_id == animal.id)
        .order_by(TemperatureLog.recorded_at.asc())
        .all()
    )
    temperatures = [
        {
            "id": t.id,
            "temperature_f": t.temperature_f,
            "is_fever": t.is_fever or (t.temperature_f > 102.5 if animal.species == "cattle" else t.temperature_f > 102.0),
            "notes": t.notes,
            "recorded_at": t.recorded_at.isoformat(),
        }
        for t in temp_logs
    ]

    # Normal range reference (Cattle: 100.4 - 102.5 °F; Buffalo: 100.0 - 102.0 °F)
    normal_temp_max = 102.5 if animal.species.lower() in ("cattle", "cow") else 102.0

    # 2. Disease and Treatment History (Newest first)
    cases = (
        db.query(Case)
        .filter(Case.animal_id == animal.id)
        .order_by(Case.created_at.desc())
        .all()
    )

    disease_timeline = []
    active_case = None
    current_medicines = []
    last_vet_visit = None

    for c in cases:
        if c.status in ("SUBMITTED", "IN_TRIAGE", "TRIAGED", "ACTIVE", "FOLLOW_UP") and not active_case:
            active_case = {
                "case_number": c.case_number,
                "status": c.status,
                "urgency": c.urgency,
                "duration_days": c.duration_days,
                "reported_symptoms": c.symptoms or [],
            }

        # Check prescription medicines
        if c.prescription:
            vet_name = c.prescription.get("prescribed_by_vet") or (c.vet_assessment.get("vet_name") if c.vet_assessment else "Dr. Ramesh Kumar (Vet)")
            diagnosis = c.prescription.get("diagnosis") or (c.vet_assessment.get("clinical_diagnosis") if c.vet_assessment else None)
            medicines = c.prescription.get("medicines") or []

            # If recent / active, populate current_medicines
            if c.status not in ("RESOLVED", "CLOSED"):
                for m in medicines:
                    current_medicines.append({
                        "name": m.get("name"),
                        "dose": m.get("dose"),
                        "duration": m.get("duration"),
                        "case_number": c.case_number,
                    })

            disease_timeline.append({
                "date": c.created_at.strftime("%Y-%m-%d"),
                "reported_symptoms": c.symptoms or [],
                "vet_confirmed_diagnosis": diagnosis or "Clinical Observation",
                "medicines": medicines,
                "vet_name": vet_name,
                "outcome": c.status,
                "notes": c.description,
            })

            if not last_vet_visit:
                last_vet_visit = c.updated_at.strftime("%Y-%m-%d")

    # 3. Vaccinations
    vacc_records = (
        db.query(VaccinationRecord)
        .filter(VaccinationRecord.animal_id == animal.id)
        .order_by(VaccinationRecord.date_administered.desc())
        .all()
    )
    vaccinations = [
        {
            "id": v.id,
            "vaccine_name": v.vaccine_name,
            "batch_number": v.batch_number,
            "administered_by_vet": v.administered_by_vet or "Dr. Ramesh Kumar (Vet)",
            "date_administered": v.date_administered.strftime("%Y-%m-%d"),
            "next_due_date": v.next_due_date.strftime("%Y-%m-%d") if v.next_due_date else None,
            "notes": v.notes,
        }
        for v in vacc_records
    ]

    # Fallback to health_events if no vaccinations table records
    if not vaccinations:
        hev_vacc = (
            db.query(HealthEvent)
            .filter(HealthEvent.animal_id == animal.id, HealthEvent.event_type == "vaccination")
            .order_by(HealthEvent.event_date.desc())
            .all()
        )
        for h in hev_vacc:
            vaccinations.append({
                "id": h.id,
                "vaccine_name": h.title,
                "batch_number": None,
                "administered_by_vet": "Animal Husbandry Vet Officer",
                "date_administered": str(h.event_date),
                "next_due_date": None,
                "notes": h.notes,
            })

    # Recent cases summary list
    recent_cases = [
        {
            "case_number": c.case_number,
            "status": c.status,
            "urgency": c.urgency,
            "date": c.created_at.strftime("%Y-%m-%d"),
            "symptoms": c.symptoms or [],
        }
        for c in cases[:5]
    ]

    return {
        "access_level": "FULL",
        "viewer_role": viewer_role,
        "is_demo_data": True,
        "animal": {
            "id": animal.id,
            "tag_id": animal.tag_id,
            "name": animal.name,
            "species": animal.species,
            "breed": animal.breed,
            "age_months": animal.age_months,
            "gender": animal.gender,
            "photo_url": animal.photo_url,
            "status": animal.status,
        },
        "owner": {
            "name": owner_name,
            "village": owner_village,
        },
        "current_status": {
            "active_case": active_case,
            "current_medicines": current_medicines,
            "last_vet_visit": last_vet_visit,
        },
        "fever_history": {
            "normal_range_f": {"min": 100.0, "max": normal_temp_max},
            "readings": temperatures,
            "latest_reading": temperatures[-1] if temperatures else None,
        },
        "disease_treatment_timeline": disease_timeline,
        "vaccination_records": vaccinations,
        "recent_cases": recent_cases,
    }


@router.post("/{animal_id}/temperature", summary="Add a temperature reading to animal passport")
def add_temperature_reading(
    animal_id: str,
    data: TemperatureReadingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    animal = (
        db.query(Animal)
        .filter((Animal.id == animal_id) | (Animal.tag_id == animal_id))
        .first()
    )
    if not animal:
        raise HTTPException(status_code=404, detail="Animal not found")

    # Access check: owner, authorized family, or vet
    is_owner = animal.user_id == current_user.id
    is_vet = current_user.role in ("veterinarian", "admin")
    is_family = False

    if not (is_owner or is_vet):
        fam = db.query(FamilyMember).filter(FamilyMember.animal_id == animal.id, FamilyMember.phone == current_user.phone).first()
        is_family = fam is not None

    if not (is_owner or is_vet or is_family):
        raise HTTPException(status_code=403, detail="Unauthorized to record temperature for this animal")

    normal_max = 102.5 if animal.species.lower() in ("cattle", "cow") else 102.0
    is_fever = data.temperature_f > normal_max

    log = TemperatureLog(
        animal_id=animal.id,
        recorded_by_id=current_user.id,
        temperature_f=data.temperature_f,
        is_fever=is_fever,
        notes=data.notes or f"Recorded by {current_user.name} ({current_user.role})",
        recorded_at=datetime.now(timezone.utc),
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    return {
        "status": "success",
        "message": "Temperature reading recorded successfully",
        "reading": {
            "id": log.id,
            "temperature_f": log.temperature_f,
            "is_fever": log.is_fever,
            "recorded_at": log.recorded_at.isoformat(),
        },
    }
