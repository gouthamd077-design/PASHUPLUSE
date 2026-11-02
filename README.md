# PASHU PULSE 🐄 🐐 (ಪಶು ಪಲ್ಸ್)

> **AI-Assisted, Multilingual Livestock Healthcare & Early Warning Platform**  
> *Tagline:* **From First Symptom to Documented Recovery.**  
> *Pilot Region:* **Mysuru & Mandya, Karnataka, India (Cattle & Buffaloes)**  
> *Lead Innovation Anchor:* **Village-Level Disease Early Warning Network & Kannada-First Voice Intelligence**

---

## 📚 Deliverables Documentation

The complete product blueprints are organized under `/docs`:
- [**Product Requirements Document (PRD v1.0)**](file:///c:/Users/Gotham%20Preetham/PASHUPULSE/docs/PRD.md)
- [**Technical Architecture & System Design**](file:///c:/Users/Gotham%20Preetham/PASHUPULSE/docs/ARCHITECTURE.md)
- [**14-Slide Investor & Hackathon Pitch Deck**](file:///c:/Users/Gotham%20Preetham/PASHUPULSE/docs/PITCH_DECK.md)
- [**Agent Handoff & Implementation Roadmap**](file:///c:/Users/Gotham%20Preetham/PASHUPULSE/docs/AGENT_HANDOFF.md)
- [**Master Development Prompt**](file:///c:/Users/Gotham%20Preetham/PASHUPULSE/docs/MASTER_PROMPT.md)

---

## 🌟 The Eight Signature Innovation Pillars (All Live in Prototype)

1. **One-Tap Pashu Health Passport:** Dynamic QR code generation, full medical timeline, vaccination tracking, and One-Tap Emergency Summary for visiting doctors.
2. **Pashu SOS Emergency Mode:** 1-touch emergency dispatch with category selection (Bloat, Calving, Tremors), audio alert tone, and **15-minute auto-escalation countdown timer** to secondary duty officers.
3. **AI Follow-up Intelligence:** Post-treatment recovery monitoring, symptom progress evaluation, and deterioration alerts to the attending doctor.
4. **Voice-First & Missed-Call Access:** Browser Web Speech API in native Kannada (ಕನ್ನಡ) and English, automated clinical parameter extraction, farmer verbal confirmation, plus an interactive **1800 Missed-Call IVR Simulator**.
5. **Village-Level Disease Early Warning Network:** Geospatial clustering across Mandya & Mysuru taluks (Pandavapura, Srirangapatna, Nanjangud, Maddur) with `SUSPECTED`, `UNDER_VERIFICATION`, `CONFIRMED` statuses, "DEMO MODE: SYNTHETIC DATA" banner, and audio broadcast.
6. **Pashu Family Care:** Multi-caregiver herd access (Owner, Caretaker, Viewer) with real-time synchronized activity audit timeline to eliminate duplicate medication dosing.
7. **Medicine Adherence & Verification:** Digital prescription display, packaging barcode match verification simulator, and daily morning/evening dose check-offs.
8. **Pashu Learning ("Explain, Don't Just Notify"):** 45-second micro-lessons on Foot-and-Mouth Disease (FMD), Lumpy Skin Disease (LSD), and Mastitis in Kannada & English with Text-to-Speech audio and interactive quizzes.

---

## 🚀 Quick Start Guide

### 1. Backend Server (FastAPI)
```powershell
cd backend
.\.venv\Scripts\python.exe seed\seed_db.py
.\.venv\Scripts\uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- Interactive API Docs (Swagger UI): [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Health Check: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)

### 2. Run Backend Unit Tests
```powershell
cd backend
.\.venv\Scripts\pytest -v
```
All 11 tests pass with green checkmarks.

### 3. Frontend Web App (React + Vite PWA)
```powershell
cd app
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🎭 One-Click Persona Switcher for Hackathon Demonstrations

When you launch the app, you can test all three perspectives with 1 click:
- **🧑‍🌾 Farmer Panel:** Symptom reporting via Kannada voice, QR Health Passport, Pashu SOS, Pashu Family, and Medicine Adherence.
- **🩺 Veterinarian Panel:** Clinical cockpit, incoming queue, AI preliminary triage review, click-to-call, diagnosis recording, and digital prescription issuance.
- **🏛️ Administrator Panel:** Biosurveillance cluster status management, veterinary officer license verification, and district health analytics.
