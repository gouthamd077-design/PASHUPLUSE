# PASHU PULSE: Agent Handoff & Implementation Roadmap

**Document Version:** 1.0  
**Target:** Multi-Agent / Autonomous Engineering Teams & Reviewers  
**Context:** Python FastAPI + React Vite PWA + AI Pipeline  

---

## 1. Work Breakdown Structure & Agent Roles

To build, maintain, or extend PASHU PULSE without schema collisions or regressions, engineering responsibilities are decoupled across six specialized agents:

```
               [AGENT 1: Orchestrator & System Architect]
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
 [AGENT 2: Backend DB]     [AGENT 3: Farmer App]    [AGENT 4: Vet App]
 (FastAPI, Schemas, RBAC)  (PWA, Voice, SOS, Passport)(Queue, Rx, Assessment)
         │                         │                         │
         └─────────────────────────┼─────────────────────────┘
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         ▼                                                   ▼
 [AGENT 5: AI & Early Warning]                      [AGENT 6: QA & Testing]
 (Gemini API, Clustering, TTS)                     (Pytest, Integration, E2E)
```

### Agent 1: Orchestrator & System Architect
* **Primary Scope:** Architecture governance, API contracts, cross-cutting security, shared TypeScript/Python types, and versioning.
* **Key Artifacts:** `docs/PRD.md`, `docs/ARCHITECTURE.md`, `backend/app/config.py`.

### Agent 2: Backend & Database Engineer
* **Primary Scope:** FastAPI routes, SQLAlchemy ORM models, migrations, seed datasets, JWT auth, and role verification middleware.
* **Key Files:** `backend/app/models/`, `backend/app/routes/`, `backend/seed/`.

### Agent 3: Farmer / User Experience Engineer
* **Primary Scope:** Mobile-first PWA screens, Web Speech API integration for Kannada/English, offline IndexedDB sync, Pashu SOS, and Pashu Family.
* **Key Files:** `app/src/screens/`, `app/src/components/`, `app/src/i18n/`.

### Agent 4: Veterinarian & Admin Panel Engineer
* **Primary Scope:** Clinical review cockpit, case queue, diagnosis input, digital prescription generator, doctor verification, and cluster radar management.
* **Key Files:** `app/src/screens/VetDashboardScreen.jsx`, `app/src/screens/AdminDashboardScreen.jsx`.

### Agent 5: AI & Early Warning Specialist
* **Primary Scope:** Gemini API prompts, fallback rule engine, geospatial clustering algorithm for village early warning, and bilingual audio synthesis.
* **Key Files:** `backend/app/services/ai_triage.py`, `app/src/services/voiceService.js`.

### Agent 6: Test Automation & QA Engineer
* **Primary Scope:** Pytest suite for API endpoints, offline sync validation, role protection tests, and end-to-end case lifecycle verification.
* **Key Files:** `backend/tests/`.

---

## 2. API Contract & Data Transfer Objects (DTO)

All inter-module communication adheres to strictly typed JSON contracts:

### Case Submission DTO
```json
{
  "animal_id": "uuid",
  "symptoms": ["fever", "reduced_feed", "salivation"],
  "description": "Cow stopped grazing 2 days ago and has high temperature",
  "duration_days": 2,
  "temperature_f": 104.2,
  "appetite": "reduced",
  "photo_url": "data:image/jpeg;base64,...",
  "location_name": "Nanjangud, Mysuru",
  "latitude": 12.1200,
  "longitude": 76.6800,
  "language": "kn"
}
```

### AI Triage Output DTO
```json
{
  "status": "success",
  "risk_level": "URGENT",
  "possible_indicators": [
    "Acute Febrile Syndrome",
    "Suspected Bovine Viral Infection (FMD rule-out)"
  ],
  "recommended_next_steps": [
    "Isolate affected animal immediately",
    "Do not force-feed solid fodder; offer clean water with electrolytes",
    "Awaiting physical/telephonic examination by Dr. Ramesh Kumar"
  ],
  "disclaimer": "PRELIMINARY AI TRIAGE ONLY. Must be verified by a licensed veterinarian."
}
```

### Veterinarian Assessment & Prescription DTO
```json
{
  "case_id": "PP-2026-00124",
  "diagnosis": "Acute Bovine Ephemeral Fever with secondary anorexia",
  "clinical_notes": "Lung auscultation normal. Mucous membranes congested. Temp 104.0F.",
  "prescription": {
    "medicines": [
      {
        "name": "Meloxicam Injection / Bolus (100mg)",
        "dosage": "2 boluses",
        "frequency": "Morning & Evening (BID)",
        "duration_days": 3,
        "instructions": "Administer after feed. For fever and pain relief."
      },
      {
        "name": "B-Complex + Liver Extract Syrup",
        "dosage": "50 ml",
        "frequency": "Once daily (OD)",
        "duration_days": 5,
        "instructions": "Oral administration to stimulate appetite."
      }
    ],
    "followup_date": "2026-11-05"
  }
}
```

---

## 3. Deployment & Environment Checklist

1. **Python Virtual Environment:**
   ```powershell
   cd backend
   .\.venv\Scripts\python.exe -m pip install -r requirements.txt
   .\.venv\Scripts\python.exe seed\seed_db.py
   ```
2. **Backend Server Startup:**
   ```powershell
   .\.venv\Scripts\uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
3. **Frontend PWA Client Startup:**
   ```powershell
   cd app
   npm install
   npm run dev -- --host 127.0.0.1 --port 5173
   ```
4. **Automated Test Verification:**
   ```powershell
   .\.venv\Scripts\pytest -v
   ```
