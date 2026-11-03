from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.user import User
from app.models.animal import Animal
from app.schemas.animal import AnimalCreate, AnimalUpdate, AnimalResponse
from app.routes.deps import get_current_user

router = APIRouter(prefix="/animals", tags=["Animals"])


@router.get("", response_model=List[AnimalResponse], summary="List animals owned by current farmer")
def list_animals(
    status_filter: Optional[str] = Query("active", alias="status", description="Filter by status (active/archived/all)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Animal).filter(Animal.user_id == current_user.id)
    if status_filter and status_filter != "all":
        query = query.filter(Animal.status == status_filter)
    return query.order_by(Animal.created_at.desc()).all()


@router.post("", response_model=AnimalResponse, status_code=status.HTTP_201_CREATED, summary="Register a new animal")
def create_animal(
    data: AnimalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Check if ID already exists (idempotency check for offline sync retry)
    existing = db.query(Animal).filter(Animal.id == data.id).first()
    if existing:
        if existing.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Animal ID conflict")
        return existing

    now = datetime.now(timezone.utc)
    animal = Animal(
        id=data.id,
        user_id=current_user.id,
        tag_id=data.tag_id,
        name=data.name,
        species=data.species,
        breed=data.breed,
        gender=data.gender,
        age_months=data.age_months,
        photo_url=data.photo_url,
        status="active",
        created_at=now,
        updated_at=data.updated_at or now,
        server_updated_at=now,
    )
    db.add(animal)
    db.commit()
    db.refresh(animal)
    return animal


@router.get("/{animal_id}", response_model=AnimalResponse, summary="Get single animal details")
def get_animal(
    animal_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    animal = db.query(Animal).filter(Animal.id == animal_id, Animal.user_id == current_user.id).first()
    if not animal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Animal not found")
    return animal


@router.patch("/{animal_id}", response_model=AnimalResponse, summary="Update animal details or archive")
def update_animal(
    animal_id: str,
    data: AnimalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    animal = db.query(Animal).filter(Animal.id == animal_id, Animal.user_id == current_user.id).first()
    if not animal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Animal not found")

    update_dict = data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        if field == "updated_at":
            continue
        setattr(animal, field, value)

    now = datetime.now(timezone.utc)
    animal.updated_at = data.updated_at or now
    animal.server_updated_at = now

    db.commit()
    db.refresh(animal)
    return animal


@router.delete("/{animal_id}", summary="Delete or archive animal")
def delete_animal(
    animal_id: str,
    hard: bool = Query(False, description="Permanently delete animal from database"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    animal = db.query(Animal).filter(Animal.id == animal_id).first()
    if not animal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Animal not found")

    if animal.user_id != current_user.id and getattr(current_user, "role", None) not in ["admin", "superadmin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this animal")

    if hard:
        db.delete(animal)
        db.commit()
        return {"message": "Animal permanently deleted", "id": animal_id, "deleted": True}
    else:
        animal.status = "archived"
        now = datetime.now(timezone.utc)
        animal.updated_at = now
        animal.server_updated_at = now
        db.commit()
        return {"message": "Animal archived successfully", "id": animal_id, "deleted": True}
