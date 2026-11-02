from datetime import datetime, timezone, date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.user import User
from app.models.animal import Animal
from app.models.health_event import HealthEvent
from app.models.reminder import Reminder
from app.schemas.sync import SyncRequest, SyncResponse, SyncDelta
from app.routes.deps import get_current_user

router = APIRouter(prefix="/sync", tags=["Offline Synchronization"])


def _parse_date(val):
    if not val:
        return None
    if isinstance(val, date):
        return val
    try:
        return datetime.fromisoformat(val).date()
    except Exception:
        return date.fromisoformat(str(val)[:10])


@router.post("", response_model=SyncResponse, summary="Sync offline queued mutations & fetch updates")
def sync_data(
    payload: SyncRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    applied_count = 0

    # 1. Apply mutations in order
    for mut in payload.mutations:
        entity = mut.entity
        action = mut.action
        entity_id = mut.entity_id
        d = mut.data

        if entity == "animal":
            existing = db.query(Animal).filter(Animal.id == entity_id).first()
            if action == "create":
                if not existing:
                    animal = Animal(
                        id=entity_id,
                        user_id=current_user.id,
                        tag_id=d.get("tag_id", "NO-TAG"),
                        name=d.get("name"),
                        species=d.get("species", "cattle"),
                        breed=d.get("breed"),
                        gender=d.get("gender", "female"),
                        age_months=d.get("age_months"),
                        photo_url=d.get("photo_url"),
                        status=d.get("status", "active"),
                        created_at=mut.client_timestamp,
                        updated_at=mut.client_timestamp,
                        server_updated_at=now,
                    )
                    db.add(animal)
                    applied_count += 1
                elif existing.user_id == current_user.id:
                    # LWW check
                    if mut.client_timestamp >= existing.updated_at.replace(tzinfo=timezone.utc if existing.updated_at.tzinfo is None else None):
                        for k in ["tag_id", "name", "species", "breed", "gender", "age_months", "photo_url", "status"]:
                            if k in d:
                                setattr(existing, k, d[k])
                        existing.updated_at = mut.client_timestamp
                        existing.server_updated_at = now
                        applied_count += 1

            elif action == "update" and existing and existing.user_id == current_user.id:
                for k in ["tag_id", "name", "species", "breed", "gender", "age_months", "photo_url", "status"]:
                    if k in d:
                        setattr(existing, k, d[k])
                existing.updated_at = mut.client_timestamp
                existing.server_updated_at = now
                applied_count += 1

            elif action == "delete" and existing and existing.user_id == current_user.id:
                existing.status = "archived"
                existing.updated_at = mut.client_timestamp
                existing.server_updated_at = now
                applied_count += 1

        elif entity == "health_event":
            existing = db.query(HealthEvent).filter(HealthEvent.id == entity_id).first()
            if action == "create":
                if not existing:
                    event = HealthEvent(
                        id=entity_id,
                        animal_id=d.get("animal_id"),
                        user_id=current_user.id,
                        event_type=d.get("event_type", "general"),
                        event_date=_parse_date(d.get("event_date")) or now.date(),
                        title=d.get("title", "Health Event"),
                        notes=d.get("notes"),
                        cost=d.get("cost"),
                        created_at=mut.client_timestamp,
                        updated_at=mut.client_timestamp,
                        server_updated_at=now,
                    )
                    db.add(event)
                    applied_count += 1
                elif existing.user_id == current_user.id:
                    existing.title = d.get("title", existing.title)
                    existing.notes = d.get("notes", existing.notes)
                    existing.cost = d.get("cost", existing.cost)
                    existing.updated_at = mut.client_timestamp
                    existing.server_updated_at = now
                    applied_count += 1

            elif action == "delete" and existing and existing.user_id == current_user.id:
                db.delete(existing)
                applied_count += 1

        elif entity == "reminder":
            existing = db.query(Reminder).filter(Reminder.id == entity_id).first()
            if action == "create":
                if not existing:
                    rem = Reminder(
                        id=entity_id,
                        user_id=current_user.id,
                        animal_id=d.get("animal_id"),
                        title=d.get("title", "Reminder"),
                        due_date=_parse_date(d.get("due_date")) or now.date(),
                        reminder_type=d.get("reminder_type", "general"),
                        is_done=d.get("is_done", False),
                        completed_at=d.get("completed_at"),
                        created_at=mut.client_timestamp,
                        updated_at=mut.client_timestamp,
                        server_updated_at=now,
                    )
                    db.add(rem)
                    applied_count += 1
            elif action == "update" and existing and existing.user_id == current_user.id:
                if "is_done" in d:
                    existing.is_done = d["is_done"]
                    existing.completed_at = now if d["is_done"] else None
                if "title" in d:
                    existing.title = d["title"]
                if "due_date" in d:
                    existing.due_date = _parse_date(d["due_date"])
                if "reminder_type" in d:
                    existing.reminder_type = d["reminder_type"]
                existing.updated_at = mut.client_timestamp
                existing.server_updated_at = now
                applied_count += 1
            elif action == "delete" and existing and existing.user_id == current_user.id:
                db.delete(existing)
                applied_count += 1

    db.commit()

    # 2. Build delta updates (records modified since client last synced)
    last_sync = payload.last_synced_at

    animal_query = db.query(Animal).filter(Animal.user_id == current_user.id)
    event_query = db.query(HealthEvent).filter(HealthEvent.user_id == current_user.id)
    reminder_query = db.query(Reminder).filter(Reminder.user_id == current_user.id)

    if last_sync:
        animal_query = animal_query.filter(Animal.server_updated_at > last_sync)
        event_query = event_query.filter(HealthEvent.server_updated_at > last_sync)
        reminder_query = reminder_query.filter(Reminder.server_updated_at > last_sync)

    server_animals = animal_query.all()
    server_events = event_query.all()
    server_reminders = reminder_query.all()

    return SyncResponse(
        status="ok",
        server_time=now,
        applied_mutations=applied_count,
        delta=SyncDelta(
            animals=server_animals,
            health_events=server_events,
            reminders=server_reminders,
        ),
    )
