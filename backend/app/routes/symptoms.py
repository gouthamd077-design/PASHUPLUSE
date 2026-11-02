from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.symptom_rule import SymptomRule
from app.schemas.symptom import (
    SymptomStartRequest,
    SymptomAnswerRequest,
    SymptomStepResponse,
    SymptomCatalogItem,
    LocalizedText,
)
from app.services.symptom_engine import start_triage, answer_triage

router = APIRouter(prefix="/symptom-check", tags=["Symptom Checker"])


@router.get("/catalog", response_model=List[SymptomCatalogItem], summary="Get list of common symptoms by species")
def get_symptom_catalog(
    species: Optional[str] = Query(None, description="Filter by animal species (e.g. cattle, buffalo)"),
    db: Session = Depends(get_db),
):
    query = db.query(SymptomRule).filter(SymptomRule.is_active == True)
    if species:
        query = query.filter(SymptomRule.species == species.lower())
    rules = query.all()

    catalog = []
    for r in rules:
        name_dict = r.rule_data.get("symptom_name", {})
        catalog.append(
            SymptomCatalogItem(
                symptom_key=r.symptom_key,
                name=LocalizedText(
                    en=name_dict.get("en", r.symptom_key),
                    hi=name_dict.get("hi", r.symptom_key),
                ),
                species=r.species,
            )
        )
    return catalog


@router.get("/rules", summary="Download all active symptom rules for local offline caching in IndexedDB")
def get_offline_rules(db: Session = Depends(get_db)):
    rules = db.query(SymptomRule).filter(SymptomRule.is_active == True).all()
    return [
        {
            "id": r.id,
            "species": r.species,
            "symptom_key": r.symptom_key,
            "rule_data": r.rule_data,
            "needs_vet_review": r.needs_vet_review,
            "updated_at": r.updated_at.isoformat() if r.updated_at else None,
        }
        for r in rules
    ]


@router.post("/start", response_model=SymptomStepResponse, summary="Start guided triage session")
def start_session(
    data: SymptomStartRequest,
    db: Session = Depends(get_db),
):
    rule = (
        db.query(SymptomRule)
        .filter(
            SymptomRule.species == data.species.lower(),
            SymptomRule.symptom_key == data.symptom_key.lower(),
            SymptomRule.is_active == True,
        )
        .first()
    )
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No active symptom rule for species '{data.species}' and symptom '{data.symptom_key}'",
        )
    return start_triage(rule)


@router.post("/answer", response_model=SymptomStepResponse, summary="Submit answer to current question")
def submit_answer(
    data: SymptomAnswerRequest,
    db: Session = Depends(get_db),
):
    rule = db.query(SymptomRule).filter(SymptomRule.id == data.rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Symptom rule '{data.rule_id}' not found",
        )
    return answer_triage(rule, data.question_id, data.answer_value)
