import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_qr_passport_anonymous_access():
    """Requirement: Unauthenticated user sees only minimal public card."""
    res = client.get("/api/passport/PP-A-000101")
    assert res.status_code == 200
    data = res.json()
    assert data["access_level"] == "MINIMAL"
    assert "Sign in to view full medical records" in data["message"]
    assert data["animal"]["tag_id"] == "PP-A-000101"
    assert "fever_history" not in data
    assert "disease_treatment_timeline" not in data

def test_qr_passport_unknown_animal():
    """Requirement: Unknown or invalid QR code returns clear 404 error."""
    res = client.get("/api/passport/NON-EXISTENT-TAG-999")
    assert res.status_code == 404
    data = res.json()
    assert "was not found" in (data.get("detail") or data.get("message") or "")

def test_qr_passport_owner_access():
    """Requirement: Owner sees full medical passport with fever history and vaccinations."""
    # Authenticate as farmer
    auth_res = client.post("/api/auth/verify-otp", json={"phone": "9845012345", "otp": "1234", "role": "farmer"})
    token = auth_res.json()["access_token"]

    res = client.get("/api/passport/PP-A-000101", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["access_level"] == "FULL"
    assert len(data["fever_history"]["readings"]) == 5
    # Verify fever marker
    fevers = [r for r in data["fever_history"]["readings"] if r["is_fever"]]
    assert len(fevers) >= 1
    assert any(r["temperature_f"] > 102.5 for r in fevers)
    assert len(data["vaccination_records"]) >= 1

def test_qr_passport_vet_access():
    """Requirement: Verified vet sees full passport, past disease, and prescription."""
    auth_res = client.post("/api/auth/verify-otp", json={"phone": "9845099999", "otp": "1234", "role": "veterinarian"})
    token = auth_res.json()["access_token"]

    res = client.get("/api/passport/PP-A-000102", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["access_level"] == "FULL"
    assert len(data["disease_treatment_timeline"]) >= 1
    first_disease = data["disease_treatment_timeline"][0]
    assert len(first_disease["medicines"]) >= 1
    assert "Intramammary Cloxacillin" in first_disease["medicines"][0]["name"]
