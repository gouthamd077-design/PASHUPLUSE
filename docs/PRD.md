# PASHU PULSE: Product Requirements Document (PRD)

**Document Version:** 1.0  
**Date:** November 2, 2026  
**Author:** Product & Architecture Team (@Daniel)  
**Status:** Approved for Implementation (Hackathon & MVP Pilot)  
**Target Pilot Region:** Mysuru and Mandya Districts, Karnataka, India  
**Target Livestock:** Cattle (*Bos taurus / Bos indicus*) and Buffaloes (*Bubalus bubalis*)  
**Primary Languages:** Kannada (ಕನ್ನಡ) and English; Planned: Hindi, Telugu, Tamil, Malayalam  

---

## 1. Executive Summary & Product Positioning

**PASHU PULSE** is an AI-assisted, multilingual livestock healthcare and early-warning ecosystem that turns a farmer's or field worker's livestock health report into a veterinarian-reviewed case, and aggregates clusters of those reports into village-level early warnings.

* **Product Tagline & Positioning:** *From First Symptom to Documented Recovery.*
* **Core Anchor & Lead Differentiator:** The **Village-Level Disease Early Warning Engine** (report clusters, abstaining AI triage, local disease risk mapping, and regional Kannada alerts). 
* **Supporting Platform:** Longitudinal animal health passports, Pashu SOS emergency dispatch, family multi-caregiver access, and medicine adherence tracking.
* **Clinical Safety Stance:** **AI prepares preliminary triage reports and NEVER diagnoses or prescribes.** All clinical diagnoses, drug selections, dosages, and treatment authorizations remain under the sole authority of verified, licensed veterinarians.

---

## 2. Problem Statement & Market Opportunity

Indian smallholder dairy farmers and livestock rearers face several systemic vulnerabilities:
1. **Delayed Veterinary Access:** Remote rural geography leads to delayed doctor visits, escalating treatable infections into fatalities or milk production loss.
2. **Language & Digital Literacy Divide:** Existing farm advisory tools are text-heavy English/Hindi portals that exclude Kannada-speaking rural farmers.
3. **Fragmented Medical History:** Paper prescriptions are routinely lost, leading to repetitive or conflicting antibiotic administration across different practitioners.
4. **Treatment Abandonment:** Over 40% of prescribed veterinary courses are terminated prematurely once acute fever subsides, causing antibiotic resistance and chronic relapse.
5. **Slow Outbreak Detection:** Contagious viral outbreaks (e.g., Foot-and-Mouth Disease, Lumpy Skin Disease) spread across villages weeks before official public health surveillance notices.

PASHU PULSE connects the fragmented animal healthcare journey into a single verified, closed-loop workflow:
$$\text{Detection (Voice/Photo)} \longrightarrow \text{AI Preliminary Triage} \longrightarrow \text{Vet Assessment} \longrightarrow \text{Digital Rx} \longrightarrow \text{Adherence Tracking} \longrightarrow \text{Documented Recovery}$$

---

## 3. Users, Roles & Permissions (RBAC Matrix)

Roles are strictly validated server-side. A client can never elevate its own permissions. The administrative role carries operational oversight but **no clinical authority**.

| Role | Permitted Actions | Prohibited Actions |
|---|---|---|
| **Farmer / Owner** | Register cattle/buffaloes, submit symptoms (manual/voice/photo), trigger Pashu SOS, invite family members, view prescriptions, log daily medicine doses, access Pashu Learning & Copilot, view village alerts. | Cannot access other farmers' private records; cannot diagnose or alter prescriptions. |
| **Family Member / Caretaker** | View shared animal profile, record daily feed, log administered medicine doses, submit follow-up recovery photos. | Cannot reassign ownership, cannot invite external users, cannot edit clinical instructions (Viewer role is strictly read-only). |
| **Livestock Worker / Pashu Sakha** | Register farmers and animals with explicit consent, submit symptom reports on behalf of low-literacy farmers, assist with photo triage. | Cannot access animal records without registered consent; cannot issue medical prescriptions. |
| **Veterinarian (Verified)** | Receive incoming cases, review AI triage reports, accept/decline cases, conduct teleconsult/home-visit, enter confirmed clinical diagnosis, issue digital prescriptions, schedule follow-ups, verify disease clusters. | Cannot act before administrative license verification; cannot alter another veterinarian's active prescription without clinical handover. |
| **Platform Administrator** | Verify veterinary credentials, suspend accounts, maintain medicine catalogue, monitor suspected disease clusters, view audit logs, broadcast verified community alerts. | **Strictly prohibited from diagnosing, prescribing, or editing medical records.** |

---

## 4. The Eight Signature Innovation Pillars

### Pillar 1: One-Tap Pashu Health Passport
* **Unique Animal Identity:** Automatically assigns a persistent Case/Animal Identifier (e.g., `KA-MYS-2026-00412`) and generates an encrypted, scannable QR code.
* **Comprehensive Record:** Tracks age, breed, lactation cycle, vaccination timeline (FMD, HS, BQ), previous illnesses, and previous prescriptions.
* **One-Tap Emergency Summary:** When scanned by an attending veterinarian, immediately displays active health issues, past antibiotic reactions, recent drug history, and emergency contact details without exposing extraneous private farmer data.

### Pillar 2: Pashu SOS Emergency Dispatch
* **One-Touch Trigger:** High-visibility emergency button with audio pulse and instant location geo-tagging (Mysuru/Mandya taluks).
* **Urgent Triage Categories:** Severe bloat/tympanites, dystocia (calving emergency), acute recumbency with high fever, choking, or severe hemorrhage.
* **Automated Escalation Protocol:** Case dispatched to nearest verified government/private veterinarians. If unaccepted within **15 minutes**, automatically escalates to secondary emergency duty officers with direct click-to-call dialing.

### Pillar 3: AI Follow-Up Intelligence
* **Longitudinal Progress Monitoring:** Moves beyond initial diagnosis to monitor what happens after treatment.
* **Scheduled Reminders:** Prompts farmer at 24h, 48h, and 72h post-prescription for appetite, temperature, and recovery photo.
* **Deterioration Detection:** AI evaluates reported symptoms against baseline; flags deteriorating conditions immediately to the prescribing veterinarian for reassessment.

### Pillar 4: Voice-First Reporting & Missed-Call Support
* **Regional Speech-to-Case:** Real-time Kannada (ಕನ್ನಡ) and English speech recognition using browser Web Speech API with backend NLP extraction.
* **Structured Information Extraction:** Converts conversational Kannada (e.g., *"ನನ್ನ ಹಸುವಿಗೆ ಎರಡು ದಿನಗಳಿಂದ ಜ್ವರ ಇದೆ, ಸರಿಯಾಗಿ ಹುಲ್ಲು ತಿನ್ನುತ್ತಿಲ್ಲ"*) into a structured clinical case draft (Species: Cattle, Duration: 2 days, Symptoms: Fever, Anorexia).
* **Missed-Call & IVR Channel (Rural Accessibility):** Farmers without smartphones dial a toll-free number (`1800-PASHU-PULSE`), triggering an automated interactive IVR callback in Kannada to record symptoms.

### Pillar 5: Village-Level Disease Early Warning Network
* **Geospatial Cluster Detection:** Aggregates anonymized symptom reports across villages (e.g., Nanjangud, Srirangapatna, Maddur, Pandavapura, Hunsur).
* **Tri-State Verification Status:**
  1. `SUSPECTED`: AI detects a cluster of similar reports exceeding standard baseline variance.
  2. `UNDER_VERIFICATION`: Assigned veterinary officer investigates the village on-ground.
  3. `CONFIRMED`: Public health / veterinary authority confirms the outbreak; automated alerts pushed to dairy cooperatives in that radius.
* **Safety & Ethics:** Clear UI banner states: **"DEMO MODE: SYNTHETIC DATA FOR EARLY WARNING DEMONSTRATION"** to prevent rural panic during hackathon/pilot testing.

### Pillar 6: Pashu Family (Shared Animal Care)
* **Multi-Caregiver Coordination:** Allows multiple family members (Father, Mother, Son) and farm hands to manage the same animal herd.
* **Role Permissions:** Owner (full control), Caretaker (log feeding and medicines), Viewer (read-only monitoring).
* **Shared Activity Audit Timeline:** Real-time chronological audit trail of all actions (e.g., *"Mother confirmed Morning Antibiotic Dose at 08:15 AM"*, *"Dr. Ramesh issued Prescription at 10:30 AM"*). Prevents accidental double-dosing of toxic medications.

### Pillar 7: Medicine Verification & Adherence Tracking
* **Digital Prescription System:** Standardized digital Rx featuring drug name, formulation (bolus/injection/syrup), dosage, frequency (Morning/Noon/Night), duration, and milk/meat withdrawal warnings.
* **Barcode / Product Matcher:** Barcode scanner simulation allows farmers to scan medicine packaging to confirm it matches the veterinarian's prescribed item before giving it.
* **Adherence Scorecard:** Tracks daily dose check-offs and calculates compliance percentage for the veterinarian's review.

### Pillar 8: Pashu Learning ("Explain, Don't Just Notify")
* **Contextual Micro-Lessons:** Instead of a generic reminder like *"FMD vaccine due"*, explains *what* Foot-and-Mouth Disease is, *why* vaccination is vital, and *how* to prepare the animal.
* **Multilingual Audio (TTS):** 45-second regional Kannada and English audio lessons for low-literacy users.
* **Interactive Comprehension Quizzes:** Simple 2-question knowledge checks on biosecurity, mastitis detection, and heat detection.

---

## 5. Scope & Delivery Matrix (Hackathon MVP vs. Scale)

| Capability | Status in MVP Build | Demo Realization |
|---|---|---|
| **Role-based Authentication** | MVP (Real) | Phone OTP auth with instant role-switching between Farmer, Veterinarian, and Admin. |
| **Animal Registry & QR Passport** | MVP (Real) | Cattle and buffalo registration, real-time QR generation, and emergency summary modal. |
| **Manual Symptom Reporting** | MVP (Real) | Multi-step reporting with duration, temperature, photo upload, and unique Case ID (`PP-2026-XXXXX`). |
| **Kannada & English Voice Reporting** | MVP (Real) | Browser Web Speech API capturing Kannada speech and auto-populating structured form fields. |
| **AI Preliminary Triage Report** | MVP (Real) | Automated triage analysis with risk indicators and prominent preliminary disclaimer. |
| **Veterinarian Case Queue & Prescription** | MVP (Real) | Live vet queue, case acceptance, clinical assessment form, and digital prescription creation. |
| **Medicine Reminders & Dose Logging** | MVP (Real) | Morning/evening dose check-off, medicine verification demo, and adherence scoring. |
| **Village Disease Early Warning Radar** | MVP (Real + Synthetic Data) | Map grid of Mysuru/Mandya taluks showing Suspected, Under Verification, Confirmed clusters with warning banner. |
| **Pashu SOS Emergency Mode** | MVP (Real simulation) | Emergency button, emergency category, 15-minute countdown escalation timer, and doctor pinging. |
| **Pashu Family Caregivers** | MVP (Real) | Caregiver invitation, role assignment, and live chronological audit timeline. |
| **Pashu Learning Audio & Quizzes** | MVP (Real) | Kannada/English micro-lessons on FMD, Lumpy Skin, Mastitis with speech synthesis audio. |
| **Missed-Call & IVR Channel** | MVP (Interactive Simulation) | Realistic phone simulator demonstrating the 1800 missed-call and Kannada automated callback. |
| **Pashu Copilot AI Chat** | MVP (Real) | Interactive AI chat with cattle health guidance and clinical disclaimers. |
| **Offline-First Storage & Sync** | MVP (Real) | IndexedDB storage with automatic syncing when network is restored. |

---

## 6. Case Lifecycle State Machine

```
[DRAFT] 
   │
   ▼
[SUBMITTED] ───► [AI_PROCESSING] ───► [AWAITING_VETERINARIAN]
                                            │
                             ┌──────────────┴──────────────┐
                             ▼                             ▼
                        [ACCEPTED]                    [ESCALATED]
                             │                       (Timeout > 15m)
                             ▼                             │
                 [ASSESSMENT_IN_PROGRESS] ◄────────────────┘
                             │
                             ▼
                   [TREATMENT_PRESCRIBED]
                             │
                             ▼
                    [FOLLOW_UP_PENDING]
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
       [REASSESSMENT]                  [COMPLETED]
   (Condition Deteriorating)        (Recovery Documented)
```

---

## 7. Safety, Clinical Governance & Compliance

1. **Non-Diagnostic Disclaimer:** Every screen presenting AI triage outputs displays the mandatory notice:  
   > *⚠️ PRELIMINARY TRIAGE ONLY: This assessment is generated by an automated AI assistant to assist your consulting veterinarian. It does not constitute a certified veterinary diagnosis or prescription.*
2. **Prescription Integrity:** Only verified veterinarians with registered Veterinary Council numbers can create, sign, or alter prescriptions.
3. **Data Protection & Privacy (DPDP Act 2023 Compliance):** 
   * Geolocation collected strictly upon explicit user consent during symptom reporting or SOS.
   * Public disease cluster warnings are strictly aggregated and anonymized at the village level; no individual farmer identities or farm coordinates are exposed.
4. **Auditability:** Every prescription issuance, medicine confirmation, and clinical assessment is stamped with a non-repudiable user identity and UTC timestamp.
