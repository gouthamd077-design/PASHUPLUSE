from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.case import VillageCluster
from app.models.user import User
from app.routes.deps import get_current_user

router = APIRouter(prefix="/village-radar", tags=["Village Disease Early Warning Network"])


class StatusUpdateRequest(BaseModel):
    status: str  # "SUSPECTED", "UNDER_VERIFICATION", "CONFIRMED"


DISEASE_MEDICINE_PROTOCOLS = {
    "fmd": {
        "en": [
            {"name": "Potassium Permanganate (0.01% Sol)", "role": "Antiseptic Oral Wash", "usage": "Wash mouth blisters 3 times daily before feed."},
            {"name": "Boro-Glycerine Paint", "role": "Mucosal Protectant", "usage": "Apply gently to tongue and oral ulcers."},
            {"name": "Meloxicam Bolus (100mg)", "role": "Antipyretic / NSAID", "usage": "1 bolus BID after feed for fever and pain relief."},
            {"name": "Neem Oil & Fly-Repellent Ointment", "role": "Hoof Wound Care", "usage": "Apply to interdigital lesions to prevent maggot infection."}
        ],
        "kn": [
            {"name": "ಪೊಟ್ಯಾಸಿಯಮ್ ಪರ್ಮಾಂಗನೇಟ್ (0.01% ದ್ರಾವಣ)", "role": "ಬಾಯಿ ತೊಳೆಯುವ ದ್ರಾವಣ", "usage": "ಮೇವು ನೀಡುವ ಮುನ್ನ ದಿನಕ್ಕೆ 3 ಬಾರಿ ಬಾಯಿ ತೊಳೆಯಿರಿ."},
            {"name": "ಬೋರೋ-ಗ್ಲಿಸರಿನ್ ಮುಲಾಮು", "role": "ಲೋಳೆಯ ಪೊರೆ ರಕ್ಷಕ", "usage": "ನಾಲಿಗೆ ಮತ್ತು ಬಾಯಿಯ ಗುಳ್ಳೆಗಳಿಗೆ ಮೃದುವಾಗಿ ಲೇಪಿಸಿ."},
            {"name": "ಮೆಲೋಕ್ಸಿಕಾಮ್ ಬೋಲಸ್ (100mg)", "role": "ಜ್ವರ ಮತ್ತು ನೋವು ನಿವಾರಕ", "usage": "ಜ್ವರ ತಗ್ಗಿಸಲು 1 ಮಾತ್ರೆ ಬೆಳಿಗ್ಗೆ ಮತ್ತು ಸಂಜೆ."},
            {"name": "ಬೇವಿನ ಎಣ್ಣೆ ಮತ್ತು ನೊಣ ನಿವಾರಕ ಮುಲಾಮು", "role": "ಗೊರಸಿನ ಗಾಯದ ಆರೈಕೆ", "usage": "ಕಾಲುಗಳ ಗಾಯಗಳಿಗೆ ನೊಣ ಕೂರದಂತೆ ಪ್ರತಿದಿನ ಹಚ್ಚಿ."}
        ]
    },
    "lsd": {
        "en": [
            {"name": "Chlorpheniramine Maleate (Avil 10ml)", "role": "Antihistaminic", "usage": "Reduces severe allergic inflammation and skin itching."},
            {"name": "Paracetamol + Meloxicam Bolus", "role": "Fever & Edema Relief", "usage": "2 boluses daily for 3 days."},
            {"name": "Neem & Turmeric Organic Paste", "role": "Topical Antiseptic", "usage": "Apply to rupturing skin nodules twice daily."},
            {"name": "Ivermectin Subcutaneous (1 ml/50kg)", "role": "Ectoparasite Control", "usage": "Single dose under vet guidance to kill biting flies."}
        ],
        "kn": [
            {"name": "ಕ್ಲೋರ್ಫೆನಿರಮೈನ್ ಮಾಲೇಟ್ (ಅವಿಲ್ 10ml)", "role": "ತುರಿಕೆ-ಅಲರ್ಜಿ ನಿರೋಧಕ", "usage": "ಚರ್ಮದ ಉರಿಯೂತ ಮತ್ತು ತುರಿಕೆ ಕಡಿಮೆ ಮಾಡಲು ಇಂಜೆಕ್ಷನ್."},
            {"name": "ಪ್ಯಾರಸಿಟಮಾಲ್ + ಮೆಲೋಕ್ಸಿಕಾಮ್ ಬೋಲಸ್", "role": "ಜ್ವರ ಮತ್ತು ಊತ ನಿವಾರಕ", "usage": "ದಿನಕ್ಕೆ 2 ಮಾತ್ರೆಗಳು 3 ದಿನಗಳವರೆಗೆ."},
            {"name": "ಅರಿಶಿನ ಮತ್ತು ಬೇವಿನ ನೈಸರ್ಗಿಕ ಲೇಪನ", "role": "ಚರ್ಮದ ನಂಜುನಿರೋಧಕ", "usage": "ಚರ್ಮದ ಗಂಟುಗಳು ಒಡೆದ ಸ್ಥಳಗಳಿಗೆ ದಿನಕ್ಕೆ 2 ಬಾರಿ ಹಚ್ಚಿ."},
            {"name": "ಐವರ್ಮೆಕ್ಟಿನ್ ದ್ರಾವಣ", "role": "ನೊಣ-ಸೊಳ್ಳೆ ನಿಯಂತ್ರಣ", "usage": "ರಕ್ತ ಹೀರುವ ಕೀಟಗಳನ್ನು ತಡೆಗಟ್ಟಲು ಪಶುವೈದ್ಯರ ಮೂಲಕ ನೀಡಿ."}
        ]
    },
    "mastitis": {
        "en": [
            {"name": "Intramammary Cloxacillin Infusion", "role": "Targeted Teat Antibiotic", "usage": "Infuse 1 tube per affected quarter after thorough milk-out."},
            {"name": "Serratiopeptidase + Paracetamol", "role": "Anti-Inflammatory Bolus", "usage": "Reduces udder hardness and inflammatory edema."},
            {"name": "0.5% Povidone-Iodine Teat Dip", "role": "Post-Milking Antiseptic", "usage": "Dip all teat ends immediately following every milking."},
            {"name": "Trisodium Citrate Oral Powder (30g)", "role": "Milk pH Normalizer", "usage": "Give in feed daily to restore normal milk buffering."}
        ],
        "kn": [
            {"name": "ಇಂಟ್ರಾಮ್ಯಾಮರಿ ಕ್ಲಾಕ್ಸಾಸಿಲಿನ್ ಟ್ಯೂಬ್", "role": "ಕೆಚ್ಚಲಿಗೆ ಹಾಕುವ ಆಂಟಿಬಯೋಟಿಕ್", "usage": "ಪೂರ್ಣ ಹಾಲು ಕರೆದ ನಂತರ ಬಾಧಿತ ಮೊಲೆತೊಟ್ಟಿಗೆ 1 ಟ್ಯೂಬ್ ಹಾಕಿ."},
            {"name": "ಸೆರಾಟಿಯೋಪೆಪ್ಟಿಡೇಸ್ + ಪ್ಯಾರಸಿಟಮಾಲ್", "role": "ಕೆಚ್ಚಲ ಬಾವು ಕರಗಿಸುವ ಬೋಲಸ್", "usage": "ಕೆಚ್ಚಲಿನ ಗಡಸುತನ ಮತ್ತು ನೋವು ಇಳಿಸಲು ದಿನಕ್ಕೆ 2 ಬಾರಿ."},
            {"name": "0.5% ಪೋವಿಡೋನ್-ಅಯೋಡಿನ್ ಟೀಟ್ ಡಿಪ್", "role": "ಹಾಲು ಕರೆದ ನಂತರದ ದ್ರಾವಣ", "usage": "ಹಾಲು ಕರೆದ ತಕ್ಷಣ ಮೊಲೆತೊಟ್ಟುಗಳನ್ನು ದ್ರಾವಣದಲ್ಲಿ ಅದ್ದಿ."},
            {"name": "ಟ್ರೈಸೋಡಿಯಂ ಸಿಟ್ರೇಟ್ ಪುಡಿ (30 ಗ್ರಾಂ)", "role": "ಹಾಲಿನ ಗುಣಮಟ್ಟ ಸುಧಾರಕ", "usage": "ಹಾಲಿನ ಹುಳಿ ಅಂಶ ಸರಿಪಡಿಸಲು ಮೇವಿನಲ್ಲಿ ದಿನಕ್ಕೆ ಒಮ್ಮೆ ಕೊಡಿ."}
        ]
    },
    "ephemeral": {
        "en": [
            {"name": "Flunixin Meglumine / Meloxicam", "role": "Antipyretic Analgesic", "usage": "Immediate relief for 105°F 3-day stiff sickness."},
            {"name": "B-Complex with Liver Extract Syrup", "role": "Metabolic Stimulant", "usage": "50 ml daily to revive rumen motility and appetite."},
            {"name": "Oral Electrolyte & Dextrose Sachet", "role": "Anti-Dehydration Energy", "usage": "Dissolve in 5L lukewarm water to prevent recumbency."}
        ],
        "kn": [
            {"name": "ಫ್ಲೂನಿಕ್ಸಿನ್ / ಮೆಲೋಕ್ಸಿಕಾಮ್ ಇಂಜೆಕ್ಷನ್", "role": "ಜ್ವರ ಮತ್ತು ನೋವು ನಿವಾರಕ", "usage": "104-105°F ತೀವ್ರ ಜ್ವರ ಮತ್ತು ಕುಂಟುವಿಕೆಗೆ ತ್ವರಿತ ಚಿಕಿತ್ಸೆ."},
            {"name": "ಬಿ-ಕಾಂಪ್ಲೆಕ್ಸ್ ಲಿವರ್ ಟಾನಿಕ್", "role": "ಜೀರ್ಣಕ್ರಿಯೆ ಉದ್ದೀಪಕ", "usage": "ಆಹಾರ ಸೇವನೆ ಹೆಚ್ಚಿಸಲು ದಿನಕ್ಕೆ 50 ಮಿ.ಲೀ ಕುಡಿಸಿ."},
            {"name": "ಎಲೆಕ್ಟ್ರೋಲೈಟ್ ಮತ್ತು ಗ್ಲೂಕೋಸ್ ದ್ರಾವಣ", "role": "ನಿರ್ಜಲೀಕರಣ ತಡೆಗಟ್ಟುವಿಕೆ", "usage": "ಹಸು ಮಲಗಿಕೊಳ್ಳದಂತೆ ಶಕ್ತಿ ನೀಡಲು 5 ಲೀಟರ್ ನೀರಿನಲ್ಲಿ ಬೆರೆಸಿ ಕೊಡಿ."}
        ]
    },
    "bq": {
        "en": [
            {"name": "Procaine Penicillin G (High Dose)", "role": "Clostridial Antibiotic", "usage": "Urgent veterinary administration at earliest onset."},
            {"name": "Polyvalent BQ Hyperimmune Serum", "role": "Emergency Antiserum", "usage": "Passive immunity for in-contact cattle within cluster."},
            {"name": "Emergency Ring Vaccination", "role": "Cluster Prophylaxis", "usage": "Mandatory inoculation of all bovines within 5km radius."}
        ],
        "kn": [
            {"name": "ಪ್ರೊಕೇನ್ ಪೆನಿಸಿಲಿನ್ ಜಿ (ಹೆಚ್ಚಿನ ಡೋಸ್)", "role": "ತುರ್ತು ಆಂಟಿಬಯೋಟಿಕ್", "usage": "ರೋಗಲಕ್ಷಣ ಕಂಡುಬಂದ ತಕ್ಷಣ ಪಶುವೈದ್ಯರಿಂದ ಕೊಡಿಸಿ."},
            {"name": "ಬಿಕ್ಯೂ ಹೈಪರ್ಇಮ್ಯೂನ್ ಸೀರಮ್", "role": "ತುರ್ತು ರೋಗನಿರೋಧಕ ಸೀರಮ್", "usage": "ಸಂಪರ್ಕದಲ್ಲಿರುವ ಜಾನುವಾರುಗಳಿಗೆ ತಕ್ಷಣ ರಕ್ಷಣೆ."},
            {"name": "ತುರ್ತು ರಿಂಗ್ ಲಸಿಕೆ (5 ಕಿ.ಮೀ)", "role": "ಮುನ್ನೆಚ್ಚರಿಕೆ ಲಸಿಕಾ ಅಭಿಯಾನ", "usage": "ಗ್ರಾಮದ 5 ಕಿ.ಮೀ ವ್ಯಾಪ್ತಿಯ ಎಲ್ಲ ಹಸುಗಳಿಗೆ ಕಡ್ಡಾಯ ಲಸಿಕೆ."}
        ]
    },
    "theileriosis": {
        "en": [
            {"name": "Buparvaquone (2.5 mg/kg IM)", "role": "Specific Antiprotozoal", "usage": "Curative single dose under veterinary care."},
            {"name": "Flumethrin / Deltamethrin Pour-On", "role": "Acaricide Tick Kill", "usage": "Apply 10ml along spine to eradicate vectors."},
            {"name": "Iron Dextran + Vitamin B12 Tonic", "role": "Haematinic Blood Builder", "usage": "Counteracts severe tick-borne anemia."}
        ],
        "kn": [
            {"name": "ಬುಪಾರ್ವಾಕ್ವೋನ್ (2.5 mg/kg)", "role": "ಉಣ್ಣೆ ಜ್ವರ ನಿರ್ದಿಷ್ಟ ಔಷಧ", "usage": "ಪಶುವೈದ್ಯರ ಮೇಲ್ವಿಚಾರಣೆಯಲ್ಲಿ ಒಂದೇ ಡೋಸ್ ಇಂಜೆಕ್ಷನ್."},
            {"name": "ಡೆಲ್ಟಾಮೆಥ್ರಿನ್ / ಫ್ಲೂಮೆಥ್ರಿನ್ ದ್ರಾವಣ", "role": "ಉಣ್ಣೆ ನಾಶಕ ದ್ರಾವಣ", "usage": "ಬೆನ್ನು ಮೂಳೆಯ ಉದ್ದಕ್ಕೂ 10 ಮಿ.ಲೀ ಹಾಕಿ ಉಣ್ಣೆಗಳನ್ನು ನಿರ್ಮೂಲನೆ ಮಾಡಿ."},
            {"name": "ಕಬ್ಬಿಣ ಮತ್ತು ಬಿ12 ರಕ್ತವರ್ಧಕ ಟಾನಿಕ್", "role": "ರಕ್ತಹೀನತೆ ನಿವಾರಕ", "usage": "ಉಣ್ಣೆಯಿಂದ ಕಳೆದುಹೋದ ರಕ್ತ ಕಣಗಳನ್ನು ಪುನರುಜ್ಜೀವನಗೊಳಿಸಲು."}
        ]
    }
}


def _get_protocol_for_disease(disease_name: str) -> dict:
    d = (disease_name or "").lower()
    if "fmd" in d or "foot" in d or "mouth" in d:
        return DISEASE_MEDICINE_PROTOCOLS["fmd"]
    elif "lumpy" in d or "lsd" in d:
        return DISEASE_MEDICINE_PROTOCOLS["lsd"]
    elif "mastitis" in d or "ಬಾವು" in d:
        return DISEASE_MEDICINE_PROTOCOLS["mastitis"]
    elif "black" in d or "quarter" in d or "bq" in d or "ಕಪ್ಪು" in d:
        return DISEASE_MEDICINE_PROTOCOLS["bq"]
    elif "theileria" in d or "tick" in d or "ಉಣ್ಣೆ" in d:
        return DISEASE_MEDICINE_PROTOCOLS["theileriosis"]
    else:
        return DISEASE_MEDICINE_PROTOCOLS["ephemeral"]


@router.get("/clusters", summary="Get village disease clusters for early warning")
def get_clusters(
    district: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(VillageCluster)
    if district:
        query = query.filter(VillageCluster.district.ilike(f"%{district}%"))
    if status:
        query = query.filter(VillageCluster.status == status)
    
    raw_clusters = query.order_by(VillageCluster.cases_count.desc()).all()
    
    # Enrich clusters with emergency medicine protocols
    enriched_clusters = []
    for c in raw_clusters:
        proto = _get_protocol_for_disease(c.disease_name)
        c_dict = {
            "id": c.id,
            "village_name": c.village_name,
            "district": c.district,
            "disease_name": c.disease_name,
            "cases_count": c.cases_count,
            "status": c.status,
            "risk_level": c.risk_level,
            "latitude": c.latitude,
            "longitude": c.longitude,
            "alert_message_kannada": c.alert_message_kannada,
            "alert_message_english": c.alert_message_english,
            "is_synthetic": c.is_synthetic,
            "emergency_medicines_en": proto["en"],
            "emergency_medicines_kn": proto["kn"],
        }
        enriched_clusters.append(c_dict)

    return {
        "is_synthetic_mode": True,
        "banner_notice": "DEMO MODE: SYNTHETIC DATA FOR EARLY WARNING DEMONSTRATION",
        "clusters": enriched_clusters,
    }


@router.post("/clusters/{cluster_id}/verify", summary="Update cluster verification status")
def verify_cluster(
    cluster_id: str,
    req: StatusUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cluster = db.query(VillageCluster).filter(VillageCluster.id == cluster_id).first()
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")

    cluster.status = req.status
    if req.status == "CONFIRMED":
        cluster.risk_level = "HIGH"
    elif req.status == "UNDER_VERIFICATION":
        cluster.risk_level = "MEDIUM"
        
    db.commit()
    db.refresh(cluster)
    return cluster
