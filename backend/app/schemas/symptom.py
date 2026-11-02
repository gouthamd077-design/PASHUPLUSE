from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class LocalizedText(BaseModel):
    en: str
    hi: str


class SymptomOption(BaseModel):
    label: LocalizedText
    value: str


class SymptomQuestion(BaseModel):
    id: str
    text: LocalizedText
    options: List[SymptomOption]


class SymptomTriageResult(BaseModel):
    level: str  # emergency | call_vet_soon | watch
    title: LocalizedText
    guidance: List[LocalizedText]
    disclaimer: str = Field(
        default="This is guidance, not a diagnosis. Call a veterinarian if unsure. / यह सलाह मात्र है, निदान नहीं। संशय होने पर पशु चिकित्सक से संपर्क करें।"
    )
    needs_vet_review: bool = True
    is_emergency: bool = False


class SymptomStartRequest(BaseModel):
    species: str = Field(..., example="cattle")
    symptom_key: str = Field(..., example="reduced_feed")


class SymptomAnswerRequest(BaseModel):
    rule_id: str
    question_id: str
    answer_value: str


class SymptomStepResponse(BaseModel):
    status: str  # "in_progress" | "completed"
    rule_id: str
    current_question: Optional[SymptomQuestion] = None
    result: Optional[SymptomTriageResult] = None


class SymptomCatalogItem(BaseModel):
    symptom_key: str
    name: LocalizedText
    species: str
