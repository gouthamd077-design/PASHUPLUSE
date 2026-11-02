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
                "risk_level": "MEDIUM",
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
