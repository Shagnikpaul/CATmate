"""Task duration time estimation router."""
from fastapi import APIRouter
from app.schemas.prediction import TaskTimePredictRequest, TaskTimePredictResponse

router = APIRouter(prefix="/predict", tags=["Predictions"])

# Baseline task duration lookup (minutes)
TASK_BASELINES = {
    "excavation": 60,
    "loading": 45,
    "trenching": 50,
    "grading": 40,
    "backfilling": 35,
    "hauling": 30,
    "compaction": 45,
    "clearing": 55
}

@router.post("/task-time", response_model=TaskTimePredictResponse)
def predict_task_time(payload: TaskTimePredictRequest):
    """
    Predicts task duration based on task type, weather, operator skill, and machine age.
    Called both when scheduling and live by the pace indicator.
    """
    task_key = payload.task_type.lower().strip()
    baseline = TASK_BASELINES.get(task_key, payload.estimated_time_min or 45)

    # Weather multiplier
    weather_lower = payload.weather.lower().strip()
    weather_multiplier = 1.0
    if "rain" in weather_lower or "storm" in weather_lower:
        weather_multiplier = 1.25
    elif "wind" in weather_lower:
        weather_multiplier = 1.10
    elif "fog" in weather_lower:
        weather_multiplier = 1.15

    # Skill multiplier
    skill_lower = payload.operator_skill.lower().strip()
    skill_multiplier = 1.0
    if "beginner" in skill_lower:
        skill_multiplier = 1.20
    elif "expert" in skill_lower:
        skill_multiplier = 0.85
    elif "intermediate" in skill_lower:
        skill_multiplier = 1.0

    # Machine age factor (1.5% per year)
    age_multiplier = 1.0 + (max(0, payload.machine_age_yrs) * 0.015)

    # Calculate final predicted minutes
    predicted = int(round(baseline * weather_multiplier * skill_multiplier * age_multiplier))

    # Determine confidence level
    if abs(predicted - baseline) <= 10:
        confidence = "high"
    elif abs(predicted - baseline) <= 25:
        confidence = "medium"
    else:
        confidence = "low"

    return TaskTimePredictResponse(
        predicted_time_min=predicted,
        baseline_estimate_min=baseline,
        confidence=confidence
    )
