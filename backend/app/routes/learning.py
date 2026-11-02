from typing import List, Dict, Any
from fastapi import APIRouter

router = APIRouter(prefix="/learning", tags=["Pashu Learning"])

LESSONS: List[Dict[str, Any]] = [
    {
        "id": "fmd-01",
        "title_kn": "ಕಾಲು ಮತ್ತು ಬಾಯಿ ರೋಗ (FMD) ಜಾಗೃತಿ",
        "title_en": "Foot-and-Mouth Disease (FMD) Prevention",
        "category": "Infectious Viral Disease",
        "duration": "45 sec audio lesson",
        "summary_kn": "ಎಫ್‌ಎಂಡಿ ಅತ್ಯಂತ ಸಾಂಕ್ರಾಮಿಕ ರೋಗ. ಬಾಯಲ್ಲಿ ಜೊಲ್ಲು ಸುರಿಯುವುದು, ನಾಲಿಗೆ ಮತ್ತು ಗೊರಸುಗಳಲ್ಲಿ ಬೊಕ್ಕೆಗಳು ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತವೆ. ಸಕಾಲಿಕ ಲಸಿಕೆಯೇ ಮುಖ್ಯ ರಕ್ಷಣೆ.",
        "summary_en": "FMD is a highly contagious viral infection causing high fever, mouth blisters, excessive salivation, and foot lesions. Bi-annual vaccination is the primary defense.",
        "action_steps_kn": [
            "ಸೋಂಕಿತ ಹಸುವನ್ನು ಪ್ರತ್ಯೇಕ ಕೊಟ್ಟಿಗೆಯಲ್ಲಿ ಕಟ್ಟಿ.",
            "ಬೆಚ್ಚಗಿನ ಉಪ್ಪು ನೀರು ಅಥವಾ ಪೊಟ್ಯಾಸಿಯಮ್ ಪರ್ಮಾಂಗನೇಟ್ ದ್ರಾವಣದಿಂದ ಬಾಯಿ ತೊಳೆಯಿರಿ.",
            "ತಕ್ಷಣ ಪಶುವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ."
        ],
        "action_steps_en": [
            "Isolate the affected cow immediately from the herd.",
            "Wash blisters gently with mild antiseptic/potassium permanganate wash.",
            "Contact your nearest Veterinary Officer immediately for supportive therapy."
        ],
        "audio_text_kn": "ರೈತ ಬಾಂಧವರೇ, ಕಾಲು ಮತ್ತು ಬಾಯಿ ರೋಗವು ವೈರಸ್‌ನಿಂದ ಹರಡುವ ಮಾರಕ ಕಾಯಿಲೆ. ಇದು ಬಂದರೆ ಜಾನುವಾರುಗಳಲ್ಲಿ ಹಾಲು ಉತ್ಪಾದನೆ ತೀವ್ರ ಕುಸಿಯುತ್ತದೆ. ಬಾಯಲ್ಲಿ ಗುಳ್ಳೆಗಳು ಮತ್ತು ಜೊಲ್ಲು ಸುರಿದರೆ ತಕ್ಷಣ ಪಶುವೈದ್ಯರಿಗೆ ಮಾಹಿತಿ ನೀಡಿ.",
        "audio_text_en": "Farmer friends, Foot-and-Mouth disease is a rapid-spreading virus. Early vaccination prevents severe milk yield loss. If you see mouth blisters or limping, isolate your cow and notify the doctor immediately.",
        "quiz": {
            "question_kn": "ಎಫ್‌ಎಂಡಿ ರೋಗ ಲಕ್ಷಣ ಕಂಡುಬಂದಾಗ ರೈತರು ಮೊದಲಿಗೆ ಏನು ಮಾಡಬೇಕು?",
            "question_en": "What is the first step when FMD symptoms appear?",
            "options_kn": ["ಇಡೀ ಹಿಂಡಿನ ಜೊತೆ ಮೇಯಿಸುವುದು", "ಹಸುವನ್ನು ಪ್ರತ್ಯೇಕಿಸಿ ವೈದ್ಯರನ್ನು ಕರೆಯುವುದು", "ತಣ್ಣೀರಿನಲ್ಲಿ ಮೀಯಿಸುವುದು"],
            "options_en": ["Graze with entire herd", "Isolate the cow and call the vet", "Wash with ice water"],
            "correct_index": 1
        }
    },
    {
        "id": "lsd-02",
        "title_kn": "ಚರ್ಮ ಗಂಟು ರೋಗ (LSD) ಹತೋಟಿ",
        "title_en": "Lumpy Skin Disease (LSD) Control",
        "category": "Vector-Borne Disease",
        "duration": "50 sec audio lesson",
        "summary_kn": "ಚರ್ಮದ ಮೇಲೆ ಗಂಟುಗಳು ಮತ್ತು ತೀವ್ರ ಜ್ವರ ಇದರ ಮುಖ್ಯ ಲಕ್ಷಣ. ನೊಣ, ಸೊಳ್ಳೆಗಳ ಮೂಲಕ ಹರಡುತ್ತದೆ. ಕೊಟ್ಟಿಗೆಯ ಸ್ವಚ್ಛತೆ ಅತಿ ಮುಖ್ಯ.",
        "summary_en": "LSD causes firm cutaneous skin nodules, fever, and swollen lymph nodes. Spread by biting flies and mosquitoes; cattle shed hygiene is critical.",
        "action_steps_kn": [
            "ಕೊಟ್ಟಿಗೆಯಲ್ಲಿ ಬೇವಿನ ಎಲೆಯ ಹೊಗೆ ಹಾಕಿ ನೊಣ-ಸೊಳ್ಳೆಗಳನ್ನು ನಿಯಂತ್ರಿಸಿ.",
            "ಗಂಟುಗಳ ಮೇಲೆ ಅರಿಶಿನ ಮತ್ತು ಬೇವಿನ ಎಣ್ಣೆ ಲೇಪಿಸಿ.",
            "ಗರ್ಭಿಣಿ ಮತ್ತು ಕರುಗಳಿಗೆ ವಿಶೇಷ ರಕ್ಷಣೆ ನೀಡಿ."
        ],
        "action_steps_en": [
            "Control flies and vectors with neem oil or smudge smoke.",
            "Apply antiseptic paste (neem + turmeric) on ruptured nodules.",
            "Ensure goat pox vaccine protocol is completed under vet guidance."
        ],
        "audio_text_kn": "ಚರ್ಮ ಗಂಟು ರೋಗವು ನೊಣ ಮತ್ತು ಸೊಳ್ಳೆಗಳ ಕಡಿತದಿಂದ ಹರಡುತ್ತದೆ. ಕೊಟ್ಟಿಗೆಯ ಸುತ್ತ ನೀರು ನಿಲ್ಲದಂತೆ ನೋಡಿಕೊಳ್ಳಿ ಹಾಗೂ ಜ್ವರ ಬಂದಾಗ ತಕ್ಷಣ ಪಶು ಪಲ್ಸ್ ಮೂಲಕ ವರದಿ ಮಾಡಿ.",
        "audio_text_en": "Lumpy Skin Disease is transmitted by biting insects. Keep cattle pens sanitized, prevent water stagnation, and report early fever via Pashu Pulse.",
        "quiz": {
            "question_kn": "ಚರ್ಮ ಗಂಟು ರೋಗ ಹರಡುವ ಮುಖ್ಯ ವಾಹಕಗಳು ಯಾವುವು?",
            "question_en": "What is the primary vector for Lumpy Skin Disease transmission?",
            "options_kn": ["ನೊಣ ಮತ್ತು ಸೊಳ್ಳೆಗಳು", "ಒಣ ಹುಲ್ಲು", "ಕುಡಿಯುವ ನೀರು"],
            "options_en": ["Biting flies and mosquitoes", "Dry fodder", "Drinking water"],
            "correct_index": 0
        }
    },
    {
        "id": "mastitis-03",
        "title_kn": "ಕೆಚ್ಚಲು ಬಾವು ರೋಗ (ಮ್ಯಾಸ್ಟೈಟಿಸ್) ತಡೆಗಟ್ಟುವಿಕೆ",
        "title_en": "Bovine Mastitis Detection & Milk Quality",
        "category": "Bacterial Udder Infection",
        "duration": "40 sec audio lesson",
        "summary_kn": "ಹಾಲು ಕರೆಯುವ ಮೊದಲು ಮತ್ತು ನಂತರ ಕೆಚ್ಚಲನ್ನು ಶುದ್ಧವಾಗಿ ತೊಳೆಯಿರಿ. ಹಾಲು ಕರೆದ 30 ನಿಮಿಷ ಹಸು ಕೆಳಗೆ ಮಲಗದಂತೆ ಮೇವು ನೀಡಿ.",
        "summary_en": "Mastitis is bacterial inflammation of the mammary gland causing watery/clotted milk and painful swelling. Post-milking teat dipping prevents 80% of infections.",
        "action_steps_kn": [
            "ಹಾಲು ಕರೆಯುವ ಮುನ್ನ ಪೊಟ್ಯಾಸಿಯಮ್ ದ್ರಾವಣದಲ್ಲಿ ಕೆಚ್ಚಲು ಸ್ವಚ್ಛಗೊಳಿಸಿ.",
            "ಹಾಲು ಕರೆದ ತಕ್ಷಣ ಹಸು ಮಲಗದಂತೆ ಹಸಿರು ಮೇವು ಹಾಕಿ ನಿಲ್ಲಿಸಿ.",
            "ಹಾಲು ಬದಲಾದರೆ ಕೂಡಲೇ ಪರೀಕ್ಷೆಗೆ ಕಳುಹಿಸಿ."
        ],
        "action_steps_en": [
            "Wash and dry teats before milking with clean antiseptic cloth.",
            "Keep cows standing for 30 minutes after milking by offering feed.",
            "If milk turns watery or curdled, alert the veterinarian immediately."
        ],
        "audio_text_kn": "ಹಾಲು ಕರೆದ ಅರ್ಧ ಗಂಟೆಯವರೆಗೆ ಮೊಲೆ ತೊಟ್ಟುಗಳ ದ್ವಾರ ತೆರೆದಿರುತ್ತದೆ. ಆ ಸಮಯದಲ್ಲಿ ಹಸು ನೆಲದಲ್ಲಿ ಮಲಗಿದರೆ ಸೂಕ್ಷ್ಮಾಣುಜೀವಿಗಳು ಸೇರಿ ಕೆಚ್ಚಲು ಬಾವು ಬರುತ್ತದೆ.",
        "audio_text_en": "Teat canals remain open for thirty minutes after milking. Keeping the animal standing prevents bacterial entry from the ground.",
        "quiz": {
            "question_kn": "ಹಾಲು ಕರೆದ ನಂತರ ಹಸು ಮಲಗದಂತೆ ಮಾಡಲು ಏನು ಮಾಡಬೇಕು?",
            "question_en": "How do you keep a cow standing immediately after milking?",
            "options_kn": ["ಮೇವು ನೀಡುವುದು", "ನೀರು ಸುರಿಯುವುದು", "ಕಟ್ಟಿಹಾಕುವುದು"],
            "options_en": ["Offer fresh palatable feed", "Pour water on it", "Tie it tightly"],
            "correct_index": 0
        }
    }
]


@router.get("/lessons", summary="Get bilingual educational micro-lessons")
def get_lessons():
    return LESSONS
