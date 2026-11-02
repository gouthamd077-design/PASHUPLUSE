import uuid
from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient


def test_auth_and_animal_lifecycle(client: TestClient):
    # 1. Request OTP
    phone = "+919999988888"
    resp = client.post("/auth/request-otp", json={"phone": phone})
    assert resp.status_code == 200
    assert resp.json()["status"] == "otp_sent"

    # 2. Verify OTP with dev code '1234'
    verify_resp = client.post("/auth/verify-otp", json={"phone": phone, "otp": "1234"})
    assert verify_resp.status_code == 200
    token_data = verify_resp.json()
    assert "access_token" in token_data
    token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Check /auth/me
    me_resp = client.get("/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["phone"] == "9999988888"

    # 4. Create an Animal
    animal_id = str(uuid.uuid4())
    animal_payload = {
        "id": animal_id,
        "tag_id": "TEST-TAG-99",
        "name": "Lakshmi",
        "species": "cattle",
        "breed": "Gir",
        "gender": "female",
        "age_months": 36,
    }
    create_animal_resp = client.post("/animals", json=animal_payload, headers=headers)
    assert create_animal_resp.status_code == 201
    created_animal = create_animal_resp.json()
    assert created_animal["id"] == animal_id
    assert created_animal["name"] == "Lakshmi"

    # 5. List animals
    list_resp = client.get("/animals", headers=headers)
    assert list_resp.status_code == 200
    animals = list_resp.json()
    assert any(a["id"] == animal_id for a in animals)

    # 6. Add Health Event
    event_id = str(uuid.uuid4())
    event_payload = {
        "id": event_id,
        "event_type": "vaccination",
        "event_date": "2026-11-01",
        "title": "FMD Vaccine 1st Dose",
        "notes": "Administered subcutaneous injection, no adverse reaction",
        "cost": 50.0,
    }
    event_resp = client.post(f"/animals/{animal_id}/events", json=event_payload, headers=headers)
    assert event_resp.status_code == 201
    created_event = event_resp.json()
    assert created_event["id"] == event_id
    assert created_event["animal_id"] == animal_id

    # 7. List Health Events
    events_list_resp = client.get(f"/animals/{animal_id}/events", headers=headers)
    assert events_list_resp.status_code == 200
    assert len(events_list_resp.json()) >= 1

    # 8. Reminders lifecycle
    reminder_id = str(uuid.uuid4())
    rem_payload = {
        "id": reminder_id,
        "title": "Deworming Due",
        "due_date": "2026-11-15",
        "reminder_type": "deworm",
        "animal_id": animal_id,
    }
    rem_resp = client.post("/reminders", json=rem_payload, headers=headers)
    assert rem_resp.status_code == 201
    assert rem_resp.json()["id"] == reminder_id

    patch_resp = client.patch(f"/reminders/{reminder_id}", json={"is_done": True}, headers=headers)
    assert patch_resp.status_code == 200
    assert patch_resp.json()["is_done"] is True


def test_symptom_checker_triage(client: TestClient):
    # 1. Catalog
    catalog_resp = client.get("/symptom-check/catalog?species=cattle")
    assert catalog_resp.status_code == 200
    catalog = catalog_resp.json()
    assert len(catalog) >= 1

    # 2. Start triage for reduced_feed
    start_resp = client.post(
        "/symptom-check/start",
        json={"species": "cattle", "symptom_key": "reduced_feed"},
    )
    assert start_resp.status_code == 200
    step1 = start_resp.json()
    assert step1["status"] == "in_progress"
    assert step1["current_question"]["id"] == "q1"

    # 3. Answer q1 -> "yes" (leads to q2)
    step2_resp = client.post(
        "/symptom-check/answer",
        json={
            "rule_id": step1["rule_id"],
            "question_id": "q1",
            "answer_value": "yes",
        },
    )
    assert step2_resp.status_code == 200
    step2 = step2_resp.json()
    assert step2["status"] == "in_progress"
    assert step2["current_question"]["id"] == "q2"

    # 4. Answer q2 -> "yes" (leads to bloat emergency)
    step3_resp = client.post(
        "/symptom-check/answer",
        json={
            "rule_id": step1["rule_id"],
            "question_id": "q2",
            "answer_value": "yes",
        },
    )
    assert step3_resp.status_code == 200
    final_step = step3_resp.json()
    assert final_step["status"] == "completed"
    assert final_step["result"]["level"] == "emergency"
    assert final_step["result"]["is_emergency"] is True
    # Verify mandatory disclaimer
    assert "guidance" in final_step["result"]["disclaimer"].lower() or "सलाह" in final_step["result"]["disclaimer"]


def test_vets_directory(client: TestClient):
    vets_resp = client.get("/vets")
    assert vets_resp.status_code == 200
    vets = vets_resp.json()
    assert len(vets) >= 1

    districts_resp = client.get("/vets/districts")
    assert districts_resp.status_code == 200
    assert len(districts_resp.json()) >= 1


def test_offline_sync(client: TestClient):
    # Auth first
    phone = "+919999977777"
    client.post("/auth/request-otp", json={"phone": phone})
    token = client.post("/auth/verify-otp", json={"phone": phone, "otp": "1234"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    client_animal_id = str(uuid.uuid4())
    client_rem_id = str(uuid.uuid4())
    iso_now = datetime.now(timezone.utc).isoformat()

    sync_payload = {
        "mutations": [
            {
                "id": str(uuid.uuid4()),
                "entity": "animal",
                "action": "create",
                "entity_id": client_animal_id,
                "data": {
                    "tag_id": "OFFLINE-001",
                    "name": "Nandi",
                    "species": "cattle",
                    "breed": "Sahiwal",
                    "gender": "male",
                    "age_months": 24,
                },
                "client_timestamp": iso_now,
            },
            {
                "id": str(uuid.uuid4()),
                "entity": "reminder",
                "action": "create",
                "entity_id": client_rem_id,
                "data": {
                    "title": "Offline Vaccination",
                    "due_date": "2026-12-01",
                    "reminder_type": "vaccine",
                    "animal_id": client_animal_id,
                },
                "client_timestamp": iso_now,
            },
        ],
        "last_synced_at": None,
    }

    sync_resp = client.post("/sync", json=sync_payload, headers=headers)
    assert sync_resp.status_code == 200
    data = sync_resp.json()
    assert data["status"] == "ok"
    assert data["applied_mutations"] == 2
    assert any(a["id"] == client_animal_id for a in data["delta"]["animals"])
    assert any(r["id"] == client_rem_id for r in data["delta"]["reminders"])
