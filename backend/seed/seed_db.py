import json
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

# Ensure backend root is on sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.db import SessionLocal, init_db
from app.models.symptom_rule import SymptomRule
from app.models.vet import Vet
from app.models.case import VillageCluster, Case, ActivityLog
from app.models.animal import Animal
from app.models.user import User
from app.models.passport_extras import TemperatureLog, VaccinationRecord


def seed_all():
    init_db()
    db = SessionLocal()
    try:
        seed_dir = Path(__file__).resolve().parent

        # 1. Seed Symptom Rules
        rules_path = seed_dir / "symptom_rules.json"
        if rules_path.exists():
            with open(rules_path, "r", encoding="utf-8") as f:
                rules_data = json.load(f)
            for r in rules_data:
                existing = db.query(SymptomRule).filter(SymptomRule.id == r["id"]).first()
                if not existing:
                    rule = SymptomRule(
                        id=r["id"],
                        species=r["species"],
                        symptom_key=r["symptom_key"],
                        rule_data=r["rule_data"],
                        needs_vet_review=r.get("needs_vet_review", True),
                        is_active=r.get("is_active", True),
                    )
                    db.add(rule)
                else:
                    existing.rule_data = r["rule_data"]
                    existing.needs_vet_review = r.get("needs_vet_review", True)
                    existing.is_active = r.get("is_active", True)
            print(f"[SEED] Seeded {len(rules_data)} symptom rules.")

        # 2. Seed Vets
        vets_path = seed_dir / "vets.json"
        if vets_path.exists():
            with open(vets_path, "r", encoding="utf-8") as f:
                vets_data = json.load(f)
            for v in vets_data:
                existing = db.query(Vet).filter(Vet.phone == v["phone"]).first()
                if not existing:
                    vet = Vet(
                        name=v["name"],
                        role=v["role"],
                        phone=v["phone"],
                        district=v["district"],
                        sub_district=v.get("sub_district"),
                        specialization=v.get("specialization"),
                        is_verified=v.get("is_verified", True),
                    )
                    db.add(vet)
                else:
                    existing.name = v["name"]
                    existing.role = v["role"]
                    existing.district = v["district"]
                    existing.sub_district = v.get("sub_district")
                    existing.specialization = v.get("specialization")
                    existing.is_verified = v.get("is_verified", True)
            print(f"[SEED] Seeded {len(vets_data)} vets.")

        # 3. Seed Village Early Warning Clusters (Mysuru & Mandya)
        clusters_seed = [
            {
                "village_name": "Pandavapura Rural",
                "district": "Mandya",
                "disease_name": "Foot-and-Mouth Disease (FMD) Suspected",
                "cases_count": 6,
                "status": "SUSPECTED",
                "risk_level": "HIGH",
                "latitude": 12.5015,
                "longitude": 76.6711,
                "alert_message_kannada": "ಪಾಂಡವಪುರ ಸುತ್ತಮುತ್ತ 6 ಜಾನುವಾರುಗಳಲ್ಲಿ ಜೊಲ್ಲು ಸುರಿಯುವುದು ಮತ್ತು ಬಾಯಲ್ಲಿ ಗುಳ್ಳೆಗಳು ಕಂಡುಬಂದಿವೆ. ತಕ್ಷಣ ಹಸುಗಳನ್ನು ಪ್ರತ್ಯೇಕಿಸಿ ಲಸಿಕೆ ಪರಿಶೀಲಿಸಿ.",
                "alert_message_english": "6 cattle reported with excessive salivation and oral blisters in Pandavapura cluster. Quarantine affected animals and verify FMD vaccination.",
            },
            {
                "village_name": "Srirangapatna East",
                "district": "Mandya",
                "disease_name": "Lumpy Skin Disease (LSD) Alert",
                "cases_count": 4,
                "status": "UNDER_VERIFICATION",
                "risk_level": "MEDIUM",
                "latitude": 12.4218,
                "longitude": 76.6932,
                "alert_message_kannada": "ಶ್ರೀರಂಗಪಟ್ಟಣ ತಾಲ್ಲೂಕಿನಲ್ಲಿ ಚರ್ಮದ ಗಂಟು ರೋಗದ ಲಕ್ಷಣಗಳು ತಪಾಸಣೆಯಲ್ಲಿದೆ. ನೊಣ-ಸೊಳ್ಳೆ ನಿಯಂತ್ರಣಕ್ಕೆ ಬೇವಿನ ಹೊಗೆ ಹಾಕಿ.",
                "alert_message_english": "Cutaneous skin nodule cases under clinical verification in Srirangapatna. Maintain vector mosquito control.",
            },
            {
                "village_name": "Nanjangud Industrial Belt",
                "district": "Mysuru",
                "disease_name": "Bovine Mastitis Seasonal Flare",
                "cases_count": 5,
                "status": "CONFIRMED",
                "risk_level": "HIGH",
                "latitude": 12.1192,
                "longitude": 76.6806,
                "alert_message_kannada": "ನಂಜನಗೂಡು ಹಾಲಿನ ಕೇಂದ್ರ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಕೆಚ್ಚಲು ಬಾವು ದೃಢಪಟ್ಟಿದೆ. ಹಾಲು ಕರೆಯುವ ಮುನ್ನ ಮತ್ತು ನಂತರ ಸ್ವಚ್ಛತೆಗೆ ಆದ್ಯತೆ ನೀಡಿ.",
                "alert_message_english": "Confirmed subclinical mastitis spike in Nanjangud milk collection zones. Post-milking antiseptic teat dipping mandated.",
            },
            {
                "village_name": "Maddur Taluk",
                "district": "Mandya",
                "disease_name": "Acute Ephemeral Fever Pattern",
                "cases_count": 3,
                "status": "SUSPECTED",
                "risk_level": "WATCH",
                "latitude": 12.5844,
                "longitude": 77.0456,
                "alert_message_kannada": "ಮದ್ದೂರು ತಾಲ್ಲೂಕಿನಲ್ಲಿ ತೀವ್ರ ಜ್ವರ ಮತ್ತು ಕುಂಟುವ ಲಕ್ಷಣಗಳು ವರದಿಯಾಗಿವೆ. ಪಶು ಪಲ್ಸ್ ಮೂಲಕ ತಕ್ಷಣ ತಪಾಸಣೆ ಕೋರಿ.",
                "alert_message_english": "Transient 3-day stiffness and high fever cluster observed in Maddur. Report through Pashu Pulse for triage.",
            },
            {
                "village_name": "Hunsur Forest Border",
                "district": "Mysuru",
                "disease_name": "Black Quarter (BQ) Outbreak",
                "cases_count": 2,
                "status": "CONFIRMED",
                "risk_level": "HIGH",
                "latitude": 12.3082,
                "longitude": 76.2917,
                "alert_message_kannada": "ಹುಣಸೂರು ತಾಲ್ಲೂಕಿನಲ್ಲಿ ಕಪ್ಪು ಕಾಲು ರೋಗದ (BQ) ಪ್ರಕರಣ ದೃಢಪಟ್ಟಿದೆ. ಸುತ್ತಮುತ್ತಲಿನ 5 ಕಿ.ಮೀ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ತುರ್ತು ರಿಂಗ್ ಲಸಿಕೆ ಆರಂಭಿಸಿ.",
                "alert_message_english": "Confirmed Black Quarter (BQ) outbreak near Hunsur. Ring vaccination and strict carcass disposal protocols deployed.",
            },
            {
                "village_name": "KR Pet Dairy Cooperative",
                "district": "Mandya",
                "disease_name": "Theileriosis Tick Fever",
                "cases_count": 4,
                "status": "UNDER_VERIFICATION",
                "risk_level": "MEDIUM",
                "latitude": 12.8611,
                "longitude": 76.4912,
                "alert_message_kannada": "ಕೆ.ಆರ್. ಪೇಟೆ ಹಾಲು ಒಕ್ಕೂಟ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಉಣ್ಣೆ ಜ್ವರ (ಥೈಲೇರಿಯಾಸಿಸ್) ಶಂಕೆ. ಉಣ್ಣೆ ನಿಯಂತ್ರಣಕ್ಕೆ ಕೀಟನಾಶಕ ದ್ರಾವಣ ಸಿಂಪಡಿಸಿ.",
                "alert_message_english": "Theileriosis tick-borne febrile syndrome under laboratory screening in KR Pet dairy cooperative farms.",
            }
        ]

        for c in clusters_seed:
            existing = db.query(VillageCluster).filter(VillageCluster.village_name == c["village_name"]).first()
            if not existing:
                cluster = VillageCluster(
                    id=str(uuid.uuid4()),
                    village_name=c["village_name"],
                    district=c["district"],
                    disease_name=c["disease_name"],
                    cases_count=c["cases_count"],
                    status=c["status"],
                    risk_level=c["risk_level"],
                    latitude=c["latitude"],
                    longitude=c["longitude"],
                    alert_message_kannada=c["alert_message_kannada"],
                    alert_message_english=c["alert_message_english"],
                    is_synthetic=True,
                )
                db.add(cluster)
            else:
                existing.status = c["status"]
                existing.cases_count = c["cases_count"]
                existing.risk_level = c["risk_level"]

        print(f"[SEED] Seeded {len(clusters_seed)} village outbreak clusters.")

        # 4. Seed 3 Demo Animals for QR Scan & Passport Verification
        # Demo User (Farmer Daniel Gowda)
        farmer_user = db.query(User).filter(User.phone == "9845012345").first()
        if not farmer_user:
            farmer_user = User(
                id="1a3d3ca2-2916-4a78-9a0c-fe66d1ae508b",
                phone="9845012345",
                name="Farmer Daniel Gowda",
                role="farmer",
                language_pref="kn",
            )
            db.add(farmer_user)
            db.commit()
            db.refresh(farmer_user)

        demo_animals = [
            {
                "id": "animal-demo-fever-01",
                "tag_id": "PP-A-000101",
                "name": "Ganga (ಗಂಗಾ)",
                "species": "cattle",
                "breed": "Hallikar (ಹಳ್ಳಿಕಾರ್)",
                "gender": "female",
                "age_months": 36,
                "photo_url": "https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=400&q=80",
                "type": "fever_history",
            },
            {
                "id": "animal-demo-disease-02",
                "tag_id": "PP-A-000102",
                "name": "Yamuna (ಯಮುನಾ)",
                "species": "buffalo",
                "breed": "Murrah (ಮುರ್ರಾ)",
                "gender": "female",
                "age_months": 48,
                "photo_url": "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=400&q=80",
                "type": "past_disease",
            },
            {
                "id": "animal-demo-clean-03",
                "tag_id": "PP-A-000103",
                "name": "Nandi (ನಂದಿ)",
                "species": "cattle",
                "breed": "Amrit Mahal (ಅಮೃತ ಮಹಲ್)",
                "gender": "male",
                "age_months": 18,
                "photo_url": "https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?auto=format&fit=crop&w=400&q=80",
                "type": "no_records",
            },
        ]

        from datetime import timedelta

        for a in demo_animals:
            anim = db.query(Animal).filter(Animal.id == a["id"]).first()
            if not anim:
                anim = Animal(
                    id=a["id"],
                    user_id=farmer_user.id,
                    tag_id=a["tag_id"],
                    name=a["name"],
                    species=a["species"],
                    breed=a["breed"],
                    gender=a["gender"],
                    age_months=a["age_months"],
                    photo_url=a["photo_url"],
                    status="active",
                )
                db.add(anim)
                db.commit()

            # Seed specific scenarios:
            if a["type"] == "fever_history":
                # Clear existing temp logs for idempotency
                db.query(TemperatureLog).filter(TemperatureLog.animal_id == anim.id).delete()
                # 5 consecutive days of temperatures, one above normal (104.2 F fever)
                base_time = datetime.now(timezone.utc) - timedelta(days=5)
                temps = [101.5, 102.1, 104.2, 102.3, 101.8]
                for idx, t_val in enumerate(temps):
                    db.add(
                        TemperatureLog(
                            animal_id=anim.id,
                            recorded_by_id=farmer_user.id,
                            temperature_f=t_val,
                            is_fever=(t_val > 102.5),
                            notes="Routine evening rectal reading" if t_val <= 102.5 else "HIGH FEVER ALERT: Lethargy & warm muzzle detected",
                            recorded_at=base_time + timedelta(days=idx, hours=10),
                        )
                    )

                # Seed a vaccination
                db.query(VaccinationRecord).filter(VaccinationRecord.animal_id == anim.id).delete()
                db.add(
                    VaccinationRecord(
                        animal_id=anim.id,
                        vaccine_name="Foot and Mouth Disease (FMD) Raksha-Ovac",
                        batch_number="RO-2026-B81",
                        administered_by_vet="Dr. Ramesh Kumar (Vet Officer)",
                        date_administered=datetime.now(timezone.utc) - timedelta(days=60),
                        next_due_date=datetime.now(timezone.utc) + timedelta(days=120),
                        notes="Mandya district biannual livestock vaccination campaign",
                    )
                )

                # Seed active case for Ganga with rich prescription
                db.query(Case).filter(Case.animal_id == anim.id).delete()
                ganga_case = Case(
                    case_number="PP-2026-00124",
                    animal_id=anim.id,
                    farmer_id=farmer_user.id,
                    symptoms=["fever", "salivation", "stiffness", "reduced_feed"],
                    description="High fever (104.2 F), stiff gait, reduced ruminate movements, and watery eyes.",
                    duration_days=2,
                    temperature_f=104.2,
                    appetite="reduced",
                    location_name="Pandavapura, Mandya",
                    status="TREATMENT_PRESCRIBED",
                    urgency="URGENT",
                    preliminary_ai_report={
                        "suspected_category": "Acute Febrile Syndrome / Ephemeral Fever",
                        "triage_urgency": "URGENT",
                        "ai_disclaimer": "Preliminary AI analysis, not a diagnosis. Awaiting licensed vet assessment.",
                    },
                    vet_assessment={
                        "clinical_diagnosis": "Acute Bovine Ephemeral Fever with secondary glossitis",
                        "vet_name": "Dr. Ramesh Kumar (Vet Officer, Mandya)",
                        "vet_notes": "Febrile stiffness in forelimbs, oral mucosa congested. Antipyretic and liver tonic started.",
                        "diagnosis_time": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(),
                    },
                    prescription={
                        "prescribed_by_vet": "Dr. Ramesh Kumar (Vet Officer)",
                        "diagnosis": "Acute Bovine Ephemeral Fever",
                        "medicines": [
                            {"name": "Meloxicam Bolus (100mg)", "dose": "1 bolus BID after feed", "duration": "3 days"},
                            {"name": "B-Complex Liver Tonic (Oral Syrup)", "dose": "50 ml once daily (morning)", "duration": "5 days"},
                            {"name": "Electral Energy Booster Oral Sachet", "dose": "1 sachet in warm water", "duration": "3 days"},
                        ],
                    },
                    created_at=datetime.now(timezone.utc) - timedelta(days=2),
                )
                db.add(ganga_case)

            elif a["type"] == "past_disease":
                # Past disease case with vet prescription & diagnosis
                db.query(Case).filter(Case.animal_id == anim.id).delete()
                past_case = Case(
                    case_number="CASE-2026-0891",
                    animal_id=anim.id,
                    farmer_id=farmer_user.id,
                    symptoms=["cough", "nasal_discharge", "reduced_feed"],
                    description="Persistent wet cough, clear mucoid discharge and 25% drop in milk yield.",
                    duration_days=3,
                    temperature_f=102.4,
                    appetite="reduced",
                    location_name="Srirangapatna, Mandya",
                    status="RESOLVED",
                    urgency="NORMAL",
                    preliminary_ai_report={
                        "suspected_category": "Respiratory tract infection",
                        "triage_urgency": "NORMAL",
                        "ai_disclaimer": "Preliminary AI analysis, not a diagnosis. Awaiting licensed vet assessment.",
                    },
                    vet_assessment={
                        "clinical_diagnosis": "Bovine Bronchopneumonia (Mild, early stage)",
                        "vet_name": "Dr. Ramesh Kumar (Vet Officer, Mandya)",
                        "vet_notes": "Auscultation revealed mild bronchial rales. Clean water and quarantine advised.",
                        "diagnosis_time": (datetime.now(timezone.utc) - timedelta(days=20)).isoformat(),
                    },
                    prescription={
                        "prescribed_by_vet": "Dr. Ramesh Kumar (Vet)",
                        "diagnosis": "Bovine Bronchopneumonia",
                        "medicines": [
                            {"name": "Amoxicillin LA 15%", "dose": "15 ml IM", "duration": "3 days"},
                            {"name": "Meloxicam Bolus", "dose": "100 mg daily", "duration": "3 days"},
                        ],
                    },
                    created_at=datetime.now(timezone.utc) - timedelta(days=25),
                )
                db.add(past_case)

                # Active case for Yamuna
                active_case = Case(
                    case_number="CASE-2026-1044",
                    animal_id=anim.id,
                    farmer_id=farmer_user.id,
                    symptoms=["reduced_feed", "swollen_udder"],
                    description="Left hind quarter swollen and warm to touch after evening milking.",
                    duration_days=1,
                    temperature_f=101.9,
                    appetite="reduced",
                    location_name="Srirangapatna, Mandya",
                    status="ACTIVE",
                    urgency="HIGH",
                    preliminary_ai_report={
                        "suspected_category": "Subacute Mastitis",
                        "triage_urgency": "HIGH",
                        "ai_disclaimer": "Preliminary AI analysis, not a diagnosis.",
                    },
                    vet_assessment={
                        "clinical_diagnosis": "Subacute Mastitis (Left Hind Quarter)",
                        "vet_name": "Dr. Ramesh Kumar (Vet)",
                        "vet_notes": "Teat infusion administered. Strict milk stripping and post-dip mandated.",
                    },
                    prescription={
                        "prescribed_by_vet": "Dr. Ramesh Kumar (Vet)",
                        "diagnosis": "Subacute Mastitis",
                        "medicines": [
                            {"name": "Intramammary Cloxacillin Infusion", "dose": "1 tube LH quarter", "duration": "3 days"},
                            {"name": "Serratiopeptidase + Paracetamol", "dose": "2 bolus BID", "duration": "4 days"},
                        ],
                    },
                    created_at=datetime.now(timezone.utc) - timedelta(days=2),
                )
                db.add(active_case)

                # Seed temperature for Yamuna
                db.query(TemperatureLog).filter(TemperatureLog.animal_id == anim.id).delete()
                db.add(
                    TemperatureLog(
                        animal_id=anim.id,
                        recorded_by_id=farmer_user.id,
                        temperature_f=101.9,
                        is_fever=False,
                        notes="Normal temperature, udder warm",
                        recorded_at=datetime.now(timezone.utc) - timedelta(days=1),
                    )
                )

            elif a["type"] == "no_records":
                # Clean animal with zero temperature logs, cases, or prescriptions
                db.query(TemperatureLog).filter(TemperatureLog.animal_id == anim.id).delete()
                db.query(Case).filter(Case.animal_id == anim.id).delete()
                db.query(VaccinationRecord).filter(VaccinationRecord.animal_id == anim.id).delete()

        db.commit()
        print(f"[SEED] Seeded 3 demo animals for QR passport verification (PP-A-000101, PP-A-000102, PP-A-000103).")

        db.commit()
        print("[SEED] Database seeding completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"[SEED ERROR] {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_all()
