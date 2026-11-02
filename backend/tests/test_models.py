import datetime
from app.db import SessionLocal
from app.models import User, Animal, HealthEvent, Reminder, SymptomRule, Vet


def test_models_creation_and_relationships():
    db = SessionLocal()
    try:
        test_phone = f"99{int(datetime.datetime.now().timestamp() * 1000) % 100000000:08d}"
        # Create a user
        user = User(phone=test_phone, name="Ramesh Kumar", language_pref="hi")
        db.add(user)
        db.commit()
        db.refresh(user)
        assert user.id is not None
        assert user.role == "farmer"

        # Create an animal for the user
        animal = Animal(
            user_id=user.id,
            tag_id=f"TAG-{test_phone[-4:]}",
            name="Gauri",
            species="cattle",
            breed="Gir",
            gender="female",
            age_months=36,
        )
        db.add(animal)
        db.commit()
        db.refresh(animal)
        assert animal.id is not None
        assert animal.owner.phone == test_phone

        # Add health event
        event = HealthEvent(
            animal_id=animal.id,
            user_id=user.id,
            event_type="vaccination",
            event_date=datetime.date(2026, 11, 2),
            title="FMD Vaccine",
            notes="Annual dose administered",
            cost=50.0,
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        assert event.id is not None
        assert len(animal.health_events) == 1

        # Add reminder
        reminder = Reminder(
            user_id=user.id,
            animal_id=animal.id,
            title="Deworming due",
            due_date=datetime.date(2026, 11, 20),
            reminder_type="deworm",
        )
        db.add(reminder)
        db.commit()
        db.refresh(reminder)
        assert reminder.is_done is False

        # Add symptom rule
        rule_id = f"test_rule_{test_phone[-6:]}"
        rule = SymptomRule(
            id=rule_id,
            species="cattle",
            symptom_key="fever",
            rule_data={"questions": []},
            needs_vet_review=True,
        )
        db.add(rule)
        db.commit()

        # Add vet
        vet = Vet(
            name="Dr. Patil",
            role="vet",
            phone=f"90{test_phone[-8:]}",
            district="Pune",
            specialization="General",
        )
        db.add(vet)
        db.commit()
        db.refresh(vet)
        assert vet.id is not None

    finally:
        db.close()
