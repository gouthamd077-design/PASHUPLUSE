from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.user import User
from app.models.animal import Animal
from app.models.health_event import HealthEvent
from app.schemas.health_event import HealthEventCreate, HealthEventResponse
from app.routes.deps import get_current_user

router = APIRouter(tags=["Health Events"])


def _verify_animal_ownership(animal_id: str, user_id: str, db: Session) -> Animal:
    animal = db.query(Animal).filter(Animal.id == animal_id).first()
    if not animal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Animal not found")
    if animal.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access records for this animal",
        )
    return animal


@router.get(
    "/animals/{animal_id}/events",
    response_model=List[HealthEventResponse],
    summary="List health events for an animal",
)
def list_health_events(
    animal_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _verify_animal_ownership(animal_id, current_user.id, db)
    return (
        db.query(HealthEvent)
        .filter(HealthEvent.animal_id == animal_id)
        .order_by(HealthEvent.event_date.desc(), HealthEvent.created_at.desc())
        .all()
    )


@router.post(
    "/animals/{animal_id}/events",
    response_model=HealthEventResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Log a health event (vaccination, illness, etc.)",
)
def create_health_event(
    animal_id: str,
    data: HealthEventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _verify_animal_ownership(animal_id, current_user.id, db)

    # Idempotency check for offline sync
    existing = db.query(HealthEvent).filter(HealthEvent.id == data.id).first()
    if existing:
        if existing.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Event ID conflict")
        return existing

    now = datetime.now(timezone.utc)
    event = HealthEvent(
        id=data.id,
        animal_id=animal_id,
        user_id=current_user.id,
        event_type=data.event_type,
        event_date=data.event_date,
        title=data.title,
        notes=data.notes,
        cost=data.cost,
        created_at=now,
        updated_at=data.updated_at or now,
        server_updated_at=now,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
