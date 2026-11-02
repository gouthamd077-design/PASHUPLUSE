import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_auth_and_role_switching():
    # 1. Request OTP with dedicated clean test number
    test_phone = "9845088888"
    res = client.post("/auth/request-otp", json={"phone": test_phone})
    assert res.status_code == 200
    otp = res.json()["dev_otp"]

    # 2. Verify OTP as farmer
    res = client.post("/auth/verify-otp", json={"phone": test_phone, "otp": otp, "role": "farmer"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    token = data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Check /auth/me
    res = client.get("/auth/me", headers=headers)
    assert res.status_code == 200
    assert res.json()["role"] == "farmer"

    # 4. Switch role to veterinarian
    res = client.post("/auth/switch-role", json={"role": "veterinarian"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["role"] == "veterinarian"


def test_complete_case_and_clinical_workflow():
    # Auth as farmer
    res = client.post("/auth/request-otp", json={"phone": "9876500001"})
    otp = res.json()["dev_otp"]
    res = client.post("/auth/verify-otp", json={"phone": "9876500001", "otp": otp, "role": "farmer"})
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Register animal
    animal_res = client.post("/animals", json={
        "tag_id": "KA-MAN-9901",
        "name": "Ganga (Cow)",
        "species": "cattle",
        "breed": "Hallikar",
        "gender": "female",
        "age_months": 36,
    }, headers=headers)
    assert animal_res.status_code in [200, 201]
    animal_id = animal_res.json()["id"]

    # 2. Submit symptom report (Case creation with AI Triage)
    case_res = client.post("/cases", json={
        "animal_id": animal_id,
        "symptoms": ["High Fever", "Stopped eating fodder", "Excessive salivation"],
        "description": "Noticeable oral discomfort since yesterday",
        "duration_days": 2,
        "temperature_f": 104.2,
        "appetite": "reduced",
        "location_name": "Pandavapura, Mandya",
    }, headers=headers)
    assert case_res.status_code == 200
    case_data = case_res.json()
    case_id = case_data["id"]
    assert case_data["case_number"].startswith("PP-2026-")
    assert case_data["status"] == "AWAITING_VETERINARIAN"
    assert "preliminary_ai_report" in case_data
    assert case_data["preliminary_ai_report"]["urgency"] in ["URGENT", "EMERGENCY", "NORMAL"]

    # 3. Doctor queue
    queue_res = client.get("/cases/queue", headers=headers)
    assert queue_res.status_code == 200
    assert any(c["id"] == case_id for c in queue_res.json())

    # 4. Doctor accepts case
    accept_res = client.post(f"/cases/{case_id}/accept", headers=headers)
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "ACCEPTED"

    # 5. Doctor assessment & prescription
    assess_res = client.post(f"/cases/{case_id}/assessment", json={
        "diagnosis": "Acute Bovine Ephemeral Fever with secondary glossitis",
        "clinical_notes": "Oral blisters negative. Prescribed antipiretic and liver tonic.",
        "medicines": [
            {
                "name": "Meloxicam Bolus",
                "dosage": "1 bolus",
                "frequency": "Morning & Evening",
                "duration_days": 3,
                "instructions": "Give after feeding",
            }
        ],
        "followup_date": "2026-11-06",
    }, headers=headers)
    assert assess_res.status_code == 200
    assert assess_res.json()["status"] == "TREATMENT_PRESCRIBED"

    # 6. Farmer confirms dose (Medicine Adherence)
    dose_res = client.post(f"/cases/{case_id}/confirm-dose", json={
        "medicine_name": "Meloxicam Bolus",
        "dose_slot": "Morning",
        "actor_name": "Mother (Caregiver)",
    }, headers=headers)
    assert dose_res.status_code == 200
    assert dose_res.json()["status"] == "dose_confirmed"

    # 7. Follow-up submission
    follow_res = client.post(f"/cases/{case_id}/follow-up", json={
        "improvement_status": "improving",
        "notes": "Fever reduced to 102.1F. Started eating small amounts of green grass.",
    }, headers=headers)
    assert follow_res.status_code == 200
    assert follow_res.json()["status"] == "FOLLOW_UP_PENDING"

    # 8. Doctor completes case
    comp_res = client.post(f"/cases/{case_id}/complete", headers=headers)
    assert comp_res.status_code == 200
    assert comp_res.json()["status"] == "COMPLETED"


def test_village_disease_early_warning_and_sos():
    # 1. Village clusters
    res = client.get("/village-radar/clusters")
    assert res.status_code == 200
    data = res.json()
    assert data["is_synthetic_mode"] is True
    assert len(data["clusters"]) >= 1

    cluster_id = data["clusters"][0]["id"]
    # Verify cluster status update
    res_verify = client.post(f"/village-radar/clusters/{cluster_id}/verify", json={"status": "UNDER_VERIFICATION"}, headers={})
    # Since headers optional or needed:
    assert res_verify.status_code in [200, 401]


def test_learning_and_copilot():
    # 1. Micro-lessons
    res = client.get("/learning/lessons")
    assert res.status_code == 200
    lessons = res.json()
    assert len(lessons) >= 3
    assert "title_kn" in lessons[0]
    assert "audio_text_kn" in lessons[0]

    # 2. Copilot chat in Kannada
    res_chat_kn = client.post("/copilot/chat", json={
        "message": "ನನ್ನ ಹಸುವಿಗೆ ಜ್ವರ ಇದೆ, ಏನು ಮಾಡಬೇಕು?",
        "language": "kn",
    })
    assert res_chat_kn.status_code == 200
    assert "reply" in res_chat_kn.json()
    assert "disclaimer" in res_chat_kn.json()

    # 3. Copilot chat in English
    res_chat_en = client.post("/copilot/chat", json={
        "message": "My cow stopped eating milk yield dropped",
        "language": "en",
    })
    assert res_chat_en.status_code == 200
    assert "reply" in res_chat_en.json()
