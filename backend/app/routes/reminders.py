from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.user import User
from app.models.reminder import Reminder
from app.schemas.reminder import ReminderCreate, ReminderUpdate, ReminderResponse
from app.routes.deps import get_current_user

router = APIRouter(prefix="/reminders", tags=["Reminders"])


@router.get("", response_model=List[ReminderResponse], summary="List farmer reminders")
def list_reminders(
    status_filter: Optional[str] = Query("all", alias="status", description="pending, completed, or all"),
    animal_id: Optional[str] = Query(None, description="Filter by animal"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Reminder).filter(Reminder.user_id == current_user.id)
    if status_filter == "pending":
        query = query.filter(Reminder.is_done == False)
    elif status_filter == "completed":
        query = query.filter(Reminder.is_done == True)

    if animal_id:
        query = query.filter(Reminder.animal_id == animal_id)

    return query.order_by(Reminder.due_date.asc(), Reminder.created_at.asc()).all()


@router.post("", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED, summary="Create a new reminder")
def create_reminder(
    data: ReminderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Idempotency check for offline sync
    existing = db.query(Reminder).filter(Reminder.id == data.id).first()
    if existing:
        if existing.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Reminder ID conflict")
        return existing

    now = datetime.now(timezone.utc)
    reminder = Reminder(
        id=data.id,
        user_id=current_user.id,
        animal_id=data.animal_id,
        title=data.title,
        due_date=data.due_date,
        reminder_type=data.reminder_type,
        is_done=False,
        created_at=now,
        updated_at=data.updated_at or now,
        server_updated_at=now,
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder


@router.patch("/{reminder_id}", response_model=ReminderResponse, summary="Update reminder / mark done")
def update_reminder(
    reminder_id: str,
    data: ReminderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reminder not found")
    if reminder.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    now = datetime.now(timezone.utc)
    update_dict = data.model_dump(exclude_unset=True)

    if "is_done" in update_dict:
        if update_dict["is_done"]:
            reminder.completed_at = now
        else:
            reminder.completed_at = None

    for key, value in update_dict.items():
        setattr(reminder, key, value)

    reminder.updated_at = now
    reminder.server_updated_at = now
    db.commit()
    db.refresh(reminder)
    return reminder


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a reminder")
def delete_reminder(
    reminder_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reminder not found")
    if reminder.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    db.delete(reminder)
    db.commit()
    return None
