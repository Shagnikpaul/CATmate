"""
Task Time Prediction Router (Section 5 & 6d).
POST /api/predict/task-time
Powered by the trained Scikit-Learn Random Forest regression model.
"""

from fastapi import APIRouter, HTTPException, status
from app.schemas.prediction import TaskTimePredictRequest, TaskTimePredictResponse
from app.services.predictor import predictor_service

router = APIRouter(prefix="/predict", tags=["Predictions"])


@router.post(
    "/task-time",
    response_model=TaskTimePredictResponse,
    summary="Predict task completion duration",
    description="Runs the trained Random Forest regression model on task type, weather, operator skill, and machine age."
)
def predict_task_time(payload: TaskTimePredictRequest):
    """
    Predicts task duration based on task type, weather, operator skill, machine age,
    and initial baseline estimate using the trained Scikit-Learn pipeline.
    """
    try:
        prediction = predictor_service.predict(
            task_type=payload.task_type,
            weather=payload.weather,
            operator_skill=payload.operator_skill,
            machine_age_yrs=payload.machine_age_yrs,
            estimated_time_min=payload.estimated_time_min
        )
        return TaskTimePredictResponse(
            predicted_time_min=prediction["predicted_time_min"],
            baseline_estimate_min=prediction["baseline_estimate_min"],
            confidence=prediction["confidence"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Task time prediction error: {str(e)}"
        )
