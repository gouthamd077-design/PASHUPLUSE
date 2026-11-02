from typing import Dict, Any, Optional
from fastapi import HTTPException, status
from app.models.symptom_rule import SymptomRule
from app.schemas.symptom import (
    SymptomStepResponse,
    SymptomQuestion,
    SymptomOption,
    SymptomTriageResult,
    LocalizedText,
)

STANDARD_DISCLAIMER = (
    "This is guidance, not a diagnosis. Call a veterinarian if unsure. "
    "/ यह सलाह मात्र है, निदान नहीं। संशय होने पर पशु चिकित्सक से संपर्क करें।"
)


def _build_question_response(rule_id: str, q_data: Dict[str, Any]) -> SymptomStepResponse:
    options = [
        SymptomOption(
            label=LocalizedText(en=opt["label"]["en"], hi=opt["label"]["hi"]),
            value=opt["value"],
        )
        for opt in q_data["options"]
    ]
    question = SymptomQuestion(
        id=q_data["id"],
        text=LocalizedText(en=q_data["text"]["en"], hi=q_data["text"]["hi"]),
        options=options,
    )
    return SymptomStepResponse(
        status="in_progress",
        rule_id=rule_id,
        current_question=question,
        result=None,
    )


def _build_outcome_response(rule_id: str, outcome_data: Dict[str, Any]) -> SymptomStepResponse:
    level = outcome_data.get("level", "call_vet_soon")
    guidance = [
        LocalizedText(en=g["en"], hi=g["hi"])
        for g in outcome_data.get("guidance", [])
    ]
    title = LocalizedText(
        en=outcome_data["title"]["en"],
        hi=outcome_data["title"]["hi"],
    )
    result = SymptomTriageResult(
        level=level,
        title=title,
        guidance=guidance,
        disclaimer=STANDARD_DISCLAIMER,
        needs_vet_review=True,
        is_emergency=(level == "emergency"),
    )
    return SymptomStepResponse(
        status="completed",
        rule_id=rule_id,
        current_question=None,
        result=result,
    )


def start_triage(rule: SymptomRule) -> SymptomStepResponse:
    data = rule.rule_data
    start_q_id = data.get("start_question_id", "q1")
    questions = {q["id"]: q for q in data.get("questions", [])}
    if start_q_id not in questions:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Malformed symptom rule: start question missing",
        )
    return _build_question_response(rule.id, questions[start_q_id])


def answer_triage(rule: SymptomRule, question_id: str, answer_value: str) -> SymptomStepResponse:
    data = rule.rule_data
    questions = {q["id"]: q for q in data.get("questions", [])}
    outcomes = data.get("outcomes", {})

    if question_id not in questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Question '{question_id}' not found in rule '{rule.id}'",
        )

    current_q = questions[question_id]
    matched_option = None
    for opt in current_q.get("options", []):
        if opt["value"] == answer_value:
            matched_option = opt
            break

    if not matched_option:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid answer '{answer_value}' for question '{question_id}'",
        )

    # If option points directly to an outcome:
    if "outcome" in matched_option:
        outcome_key = matched_option["outcome"]
        if outcome_key not in outcomes:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Outcome '{outcome_key}' not defined in rule '{rule.id}'",
            )
        return _build_outcome_response(rule.id, outcomes[outcome_key])

    # If option points to the next question:
    if "next" in matched_option:
        next_q_id = matched_option["next"]
        if next_q_id in outcomes:
            return _build_outcome_response(rule.id, outcomes[next_q_id])
        if next_q_id in questions:
            return _build_question_response(rule.id, questions[next_q_id])
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Next target '{next_q_id}' not found in rule questions or outcomes",
        )

    # Fallback to default watch
    fallback = list(outcomes.values())[0] if outcomes else {
        "level": "call_vet_soon",
        "title": {"en": "Veterinary Consultation Recommended", "hi": "पशु चिकित्सक से सलाह लें"},
        "guidance": [{"en": "Contact your nearest veterinarian.", "hi": "निकटतम पशु चिकित्सक से संपर्क करें।"}],
    }
    return _build_outcome_response(rule.id, fallback)
