# PASHU PULSE: Technical Architecture & System Design

**Version:** 1.0  
**Date:** November 2, 2026  
**Target Environment:** Local / Cloud Pilot (Karnataka: Mysuru & Mandya)  

---

## 1. System Overview & Architectural Topology

PASHU PULSE utilizes a hybrid **Offline-First PWA** coupled with a high-performance **REST & Real-Time Backend Service** and **Edge/Cloud AI Services**.

```
+-----------------------------------------------------------------------------------+
|                              CLIENT TIER (PWA)                                    |
|                                                                                   |
|  [Farmer Dashboard]      [Veterinarian Panel]       [Admin Control Center]        |
|  - Voice-to-Case (Kn/En) - Case Triage Queue        - Vet Verification Queue      |
|  - QR Health Passport    - Clinical Assessment      - Village Cluster Oversight   |
|  - Pashu SOS & Family    - Digital Rx Studio        - Audit & Analytics Logs      |
|  - Adherence & Learning  - Reassessment & History   - System Dispatches           |
|                                                                                   |
|  -------------------------------------------------------------------------------  |
|  Local Client Cache: IndexedDB (Offline Storage) + Service Worker (PWA Offline)   |
|  Browser APIs: Web Speech API (Kannada/English), Geolocation API, Web Audio        |
+-----------------------------------------------------------------------------------+
                                        │
                         HTTPS / JSON REST / WebSocket
                                        ▼
+-----------------------------------------------------------------------------------+
|                             APPLICATION BACKEND                                   |
|                                                                                   |
|  Framework: Python FastAPI / Node.js Engine (Configurable)                        |
|  Authentication: JWT (RS256/HS256) + Role-Based Access Control (RBAC Middleware)  |
|                                                                                   |
|  Core Services:                                                                   |
|  ├── Case & Triage Engine (Generates PP-2026-XXXXX, AI Preliminary Assessment)    |
|  ├── Prescription & Medicine Adherence Service (Dose schedule, QR match check)    |
|  ├── Early Warning & Village Radar Engine (Geospatial clustering for Outbreaks)   |
|  ├── Emergency SOS Dispatcher (Escalation state machine & automated alerts)       |
|  ├── Pashu Family Service (Shared access management & activity timeline logs)     |
|  └── Pashu Learning & Copilot Knowledge Engine (Bilingual audio lessons & triage) |
+-----------------------------------------------------------------------------------+
                   │                                          │
                   ▼                                          ▼
+--------------------------------------+   +--------------------------------------+
|            DATA STORAGE              |   |          EXTERNAL AI & UTILS         |
|                                      |   |                                      |
| - Primary DB: SQLite (Dev) /         |   | - AI Engine: Google Gemini API       |
|   PostgreSQL / Cloud Firestore       |   |   (Vision Triage & Multilingual NLP) |
| - Media Store: S3 / Firebase Storage |   | - Maps: Leaflet / OpenStreetMap /    |
| - Audit Store: Append-only event log |   |   Google Maps Platform               |
|                                      |   | - Telephony: Simulated IVR / Twilio  |
+--------------------------------------+   +--------------------------------------+
```

---

## 2. Database Schema & Data Models

### 2.1 Core Relational / Document Schema

1. **Users (`users`):**
   * `id`: UUID (Primary Key)
   * `phone`: VARCHAR(15), Unique, Indexed
   * `name`: VARCHAR(100)
   * `role`: VARCHAR(20) — `farmer`, `veterinarian`, `admin`
   * `language_pref`: VARCHAR(10) — `kn`, `en`, `hi`
   * `created_at`, `updated_at`: TIMESTAMP

2. **Animals (`animals`):**
   * `id`: UUID (Primary Key, client-generated for offline idempotency)
   * `user_id`: UUID (Foreign Key to `users.id`)
   * `tag_id`: VARCHAR(50), Indexed (Government ear tag or PashuPulse ID)
   * `name`: VARCHAR(100)
   * `species`: VARCHAR(30) — `cattle`, `buffalo`
   * `breed`: VARCHAR(100) (e.g., Hallikar, Amrith Mahal, Malnad Gidda, Murrah)
   * `gender`: VARCHAR(10) — `female`, `male`
   * `age_months`: INTEGER
   * `photo_url`: VARCHAR(255)
   * `status`: VARCHAR(20) — `active`, `archived`
   * `created_at`, `updated_at`: TIMESTAMP

3. **Cases (`cases`):**
   * `id`: UUID (Primary Key)
   * `case_number`: VARCHAR(30) — Unique formatted ID (e.g., `PP-2026-00124`)
   * `animal_id`: UUID (Foreign Key to `animals.id`)
   * `farmer_id`: UUID (Foreign Key to `users.id`)
   * `vet_id`: UUID (Foreign Key to `users.id`, nullable until accepted)
   * `symptoms`: JSON (List of reported symptom codes/names)
   * `description`: TEXT (Voice or manual transcript)
   * `duration_days`: INTEGER
   * `temperature_f`: FLOAT
   * `appetite`: VARCHAR(20) — `normal`, `reduced`, `absent`
   * `photo_url`: VARCHAR(255)
   * `location_name`: VARCHAR(100) (e.g., `Nanjangud, Mysuru`)
   * `latitude`, `longitude`: FLOAT
   * `status`: VARCHAR(30) — `SUBMITTED`, `AI_PROCESSING`, `AWAITING_VETERINARIAN`, `ACCEPTED`, `ASSESSMENT_IN_PROGRESS`, `TREATMENT_PRESCRIBED`, `FOLLOW_UP_PENDING`, `COMPLETED`, `ESCALATED`
   * `urgency`: VARCHAR(20) — `NORMAL`, `URGENT`, `EMERGENCY`
   * `preliminary_ai_report`: JSON `{possible_indicators, risk_level, recommended_next_steps, disclaimer}`
   * `vet_assessment`: JSON `{diagnosis, clinical_notes, verified_at}`
   * `prescription`: JSON `{medicines: [{name, dosage, frequency, duration_days, instructions}], follow_up_date}`
   * `follow_ups`: JSON (Array of follow-up updates with photos and status)
   * `created_at`, `updated_at`: TIMESTAMP

4. **Emergency SOS Requests (`sos_requests`):**
   * `id`: UUID (Primary Key)
   * `case_id`: UUID (Nullable)
   * `animal_id`: UUID
   * `user_id`: UUID
   * `category`: VARCHAR(50) (e.g., `Severe Bloat`, `Calving Emergency`, `Recumbency & High Fever`)
   * `location`: VARCHAR(100)
   * `latitude`, `longitude`: FLOAT
   * `status`: VARCHAR(20) — `TRIGGERED`, `NOTIFIED_VETS`, `ACCEPTED`, `RESOLVED`, `ESCALATED`
   * `escalation_deadline`: TIMESTAMP (15 minutes from trigger)
   * `accepted_by_vet_id`: UUID (Nullable)
   * `created_at`: TIMESTAMP

5. **Village Clusters / Early Warning (`village_clusters`):**
   * `id`: UUID (Primary Key)
   * `village_name`: VARCHAR(100)
   * `district`: VARCHAR(50) — `Mysuru`, `Mandya`
   * `disease_name`: VARCHAR(100) (e.g., `Foot-and-Mouth Disease (FMD) Suspected`, `Lumpy Skin Disease Cluster`)
   * `cases_count`: INTEGER
   * `status`: VARCHAR(30) — `SUSPECTED`, `UNDER_VERIFICATION`, `CONFIRMED`
   * `risk_level`: VARCHAR(20) — `WATCH`, `MEDIUM`, `HIGH`
   * `latitude`, `longitude`: FLOAT
   * `alert_message_kannada`: TEXT
   * `alert_message_english`: TEXT
   * `is_synthetic`: BOOLEAN (True for demo prototype with banner)
   * `updated_at`: TIMESTAMP

6. **Pashu Family Members (`pashu_family`):**
   * `id`: UUID (Primary Key)
   * `animal_id`: UUID
   * `member_name`: VARCHAR(100)
   * `member_phone`: VARCHAR(15)
   * `relation_role`: VARCHAR(20) — `OWNER`, `CARETAKER`, `VIEWER`
   * `created_at`: TIMESTAMP

7. **Animal Care Activity Logs (`activity_logs`):**
   * `id`: UUID (Primary Key)
   * `animal_id`: UUID
   * `actor_name`: VARCHAR(100)
   * `actor_role`: VARCHAR(20)
   * `action_type`: VARCHAR(50) — `MEDICINE_GIVEN`, `FEEDING_LOGGED`, `VET_CONSULT`, `PHOTO_FOLLOWUP`
   * `description`: TEXT
   * `timestamp`: TIMESTAMP

---

## 3. Core API Endpoints

### 3.1 Authentication & Profile
* `POST /auth/request-otp` — Request 4-digit OTP.
* `POST /auth/verify-otp` — Verify OTP, register user or return JWT with role.
* `GET /auth/me` — Return current authenticated user profile and permissions.
* `POST /auth/switch-role` — (Demo mode) Allows evaluator to switch persona between Farmer, Vet, Admin.

### 3.2 Animal Registry & QR Health Passport
* `GET /api/v1/animals` — List user's registered livestock.
* `POST /api/v1/animals` — Register new cow or buffalo.
* `GET /api/v1/animals/{id}` — Full profile with health timeline and past cases.
* `GET /api/v1/animals/{id}/passport` — Lightweight encrypted health passport for QR scan.

### 3.3 Cases & Veterinary Care Workflow
* `POST /api/v1/cases` — Submit new health report (symptoms, duration, photo). Automatically triggers AI preliminary triage.
* `GET /api/v1/cases` — List cases filtered by user/farmer or assigned vet.
* `GET /api/v1/cases/queue` — Incoming queue for verified veterinarians in the pilot district.
* `POST /api/v1/cases/{id}/accept` — Doctor accepts case into their active roster.
* `POST /api/v1/cases/{id}/assessment` — Doctor submits confirmed diagnosis and digital prescription.
* `POST /api/v1/cases/{id}/confirm-dose` — Farmer logs morning/evening medicine administration.
* `POST /api/v1/cases/{id}/follow-up` — Submit recovery update with progress notes and photo.
* `POST /api/v1/cases/{id}/complete` — Doctor marks case as resolved with documented outcome.

### 3.4 Pashu SOS & Early Warning
* `POST /api/v1/sos/trigger` — Trigger emergency alert with auto-escalation timer.
* `GET /api/v1/sos/active` — Real-time emergency queue for area veterinarians.
* `GET /api/v1/village-radar/clusters` — Retrieve geospatial disease clusters with triage state.
* `POST /api/v1/village-radar/clusters/{id}/verify` — Vet or Admin updates cluster verification status.

### 3.5 Pashu Family & Learning
* `GET /api/v1/family/{animal_id}` — Caregivers and shared activity audit log.
* `POST /api/v1/family/{animal_id}/members` — Invite family caregiver.
* `GET /api/v1/learning/lessons` — Kannada & English micro-lessons with audio metadata and quizzes.
* `POST /api/v1/copilot/chat` — Conversational livestock care guidance with clinical disclaimers.

---

## 4. Village-Level Early Warning Clustering Algorithm

```
Let R = {r_1, r_2, ..., r_n} be reports submitted within time window W (e.g., 7 days).
Each report r_i has (location_lat, location_lon, village_id, symptom_vector, animal_species).

1. Group reports by spatial proximity:
   Distance(r_i, r_j) <= SpatialThreshold (e.g., 5 km) OR village_id(r_i) == village_id(r_j).

2. Calculate Symptom Similarity Index (SSI):
   Using Jaccard Similarity on reported viral flags (vesicles, salivation, nodular skin lumps, acute fever):
   SSI = |Symptoms(r_i) ∩ Symptoms(r_j)| / |Symptoms(r_i) ∪ Symptoms(r_j)|

3. Cluster Threshold Evaluation:
   If Count(Matching Reports in Village V) >= 3 AND Mean(SSI) >= 0.65:
     Create / Update Cluster Record:
       - Status = 'SUSPECTED'
       - Urgency = 'HIGH'
       - Dispatch alert to Taluk Veterinary Officer for verification.

4. On-Ground Verification:
   When Licensed Vet submits verified lab/field finding:
     Status -> 'CONFIRMED'
     Push notification broadcast to all registered farmers in a 10 km radius in Kannada.
```

---

## 5. Security, Reliability & Offline Strategy

1. **Role Enforcement:** All endpoints query current JWT subject role. Non-vet tokens attempting to post to `/assessment` or `/prescriptions` receive `HTTP 403 Forbidden`.
2. **Offline-First Synchronization:**
   * Client stores drafts in IndexedDB (`pashupulse_db`).
   * When `navigator.onLine` fires, sync manager flushes queued reports with UUID idempotency keys.
3. **Graceful AI Degradation:**
   * If Gemini API times out or is unreachable, the system falls back to rule-based preliminary triage based on indexed clinical vectors (`symptom_rules.json`). Case submission is never blocked by an AI outage.
