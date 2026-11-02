from typing import Optional, List
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/copilot", tags=["Pashu Copilot AI Chat"])


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    language: str = "kn"  # "kn" or "en"
    history: Optional[List[ChatMessage]] = []


DISCLAIMER_KN = "ಗಮನಿಸಿ: ನಾನು ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆಯ ಸಹಾಯಕ (AI Assistant). ಇದು ಪ್ರಾಥಮಿಕ ಮಾರ್ಗದರ್ಶನ ಮಾತ್ರ. ರೋಗ ಪತ್ತೆ ಮತ್ತು ಚಿಕಿತ್ಸೆಗೆ ಯಾವಾಗಲೂ ನೋಂದಾಯಿತ ಪಶುವೈದ್ಯರ ಸಲಹೆ ಪಡೆಯಿರಿ."
DISCLAIMER_EN = "Note: I am an AI Assistant, not a veterinary doctor. This is advisory guidance only. Always consult a verified veterinarian for definitive diagnosis and prescriptions."


@router.post("/chat", summary="Query Pashu Copilot for livestock care guidance")
def chat_copilot(req: ChatRequest):
    msg_lower = req.message.lower()

    if req.language == "kn":
        disclaimer = DISCLAIMER_KN
        if "ಜ್ವರ" in msg_lower or "fever" in msg_lower:
            reply = (
                "ಹಸುವಿಗೆ ಜ್ವರ ಬಂದಾಗ ಮೊದಲಿಗೆ ನೆರಳಿನಲ್ಲಿ ಕಟ್ಟಿ ಸಾಕಷ್ಟು ಶುದ್ಧ ಕುಡಿಯುವ ನೀರು ಕೊಡಿ. "
                "ಸಾಮಾನ್ಯವಾಗಿ ಹಸುವಿನ ದೇಹದ ಉಷ್ಣತೆ 101.5°F ಇರುತ್ತದೆ. 103°F ಗಿಂತ ಹೆಚ್ಚಿದ್ದರೆ "
                "ದಯವಿಟ್ಟು 'ವರದಿ ಸಲ್ಲಿಸಿ' (Report Symptoms) ಬಟನ್ ಒತ್ತಿ ವೈದ್ಯರಿಗೆ ಕಳುಹಿಸಿ."
            )
        elif "ಹಾಲು" in msg_lower or "milk" in msg_lower or "ಕೆಚ್ಚಲು" in msg_lower:
            reply = (
                "ಹಾಲು ಕಡಿಮೆಯಾಗಲು ಅಥವಾ ಕೆಚ್ಚಲಿನಲ್ಲಿ ಊತ ಬರಲು ಕೆಚ್ಚಲು ಬಾವು (Mastitis) ಕಾರಣವಿರಬಹುದು. "
                "ಹಾಲು ಕರೆಯುವ ಮೊದಲು ಉಗುರುಬೆಚ್ಚಗಿನ ನೀರಿನಲ್ಲಿ ಸ್ವಚ್ಛಗೊಳಿಸಿ. ತಕ್ಷಣ ಪಶುವೈದ್ಯರ ತಪಾಸಣೆ ಅಗತ್ಯ."
            )
        elif "ಮೇವು" in msg_lower or "ತಿನ್ನುತ್ತಿಲ್ಲ" in msg_lower or "feed" in msg_lower:
            reply = (
                "ಮೇವು ತಿನ್ನದಿರುವುದು ಅಜೀರ್ಣ ಅಥವಾ ಆಂತರಿಕ ಸೋಂಕಿನ ಲಕ್ಷಣವಾಗಿರಬಹುದು. "
                "ಹೊಟ್ಟೆ ಉಬ್ಬರ ಇದೆಯೇ ಎಂದು ಗಮನಿಸಿ. ಹಸಿರು ಮೇವು ಬದಲು ತಿಳಿಯಾದ ಗಂಜಿನೀರು ಅಥವಾ ಬೆಲ್ಲದ ನೀರು ಕೊಡಿ."
            )
        else:
            reply = (
                "ನಿಮ್ಮ ಜಾನುವಾರುಗಳ ಆರೋಗ್ಯ ರಕ್ಷಣೆಗೆ ಪಶು ಪಲ್ಸ್ ಸದಾ ನಿಮ್ಮೊಂದಿಗೆ ಇದೆ. "
                "ನೀವು ಯಾವುದೇ ತುರ್ತು ಸಂದರ್ಭದಲ್ಲಿ 'ಪಶು SOS' ಬಟನ್ ಬಳಸಿ ಹತ್ತಿರದ ವೈದ್ಯರನ್ನು ಕರೆಯಬಹುದು."
            )
    else:
        disclaimer = DISCLAIMER_EN
        if "fever" in msg_lower or "hot" in msg_lower:
            reply = (
                "Normal bovine rectal temperature is 101.5°F (38.6°C). A temperature above 103.5°F indicates active infection. "
                "Keep the animal well-hydrated in a shaded shed. Use the 'Report Symptoms' feature to immediately connect with an attending veterinarian."
            )
        elif "milk" in msg_lower or "udder" in msg_lower or "teat" in msg_lower:
            reply = (
                "Sudden drops in milk yield or clots in milk often indicate early mastitis. "
                "Keep the udder sanitized, do not let milk sit in the quarter, and request a digital assessment from your local vet."
            )
        elif "eat" in msg_lower or "feed" in msg_lower or "anorexia" in msg_lower:
            reply = (
                "Anorexia (loss of appetite) in ruminants usually stems from ruminal acidosis, sudden dietary changes, or systemic febrile illness. "
                "Check for rumination (cud chewing) and rumen motility."
            )
        else:
            reply = (
                "Pashu Copilot is here to support your dairy herd management. "
                "You can ask about symptoms, vaccination dates, cattle feeding, or trigger Pashu SOS for immediate veterinary escalation."
            )

    return {
        "reply": reply,
        "disclaimer": disclaimer,
        "language": req.language,
    }
