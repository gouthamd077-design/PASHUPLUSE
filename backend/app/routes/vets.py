from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import distinct

from app.db import get_db
from app.models.vet import Vet
from app.schemas.vet import VetResponse

router = APIRouter(prefix="/vets", tags=["Veterinarians"])


@router.get("", response_model=List[VetResponse], summary="List verified veterinarians and paravets")
def list_vets(
    district: Optional[str] = Query(None, description="Filter by district"),
    search: Optional[str] = Query(None, description="Search by name or specialization"),
    db: Session = Depends(get_db),
):
    query = db.query(Vet).filter(Vet.is_verified == True)
    if district and district.lower() != "all":
        query = query.filter(Vet.district.ilike(f"%{district}%"))
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Vet.name.ilike(search_pattern))
            | (Vet.specialization.ilike(search_pattern))
            | (Vet.role.ilike(search_pattern))
        )
    return query.order_by(Vet.district.asc(), Vet.name.asc()).all()


@router.get("/districts", response_model=List[str], summary="Get list of available districts")
def list_districts(db: Session = Depends(get_db)):
    rows = db.query(Vet.district).filter(Vet.is_verified == True).distinct().order_by(Vet.district.asc()).all()
    return [r[0] for r in rows if r[0]]
