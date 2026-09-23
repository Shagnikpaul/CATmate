"""
Task Time Prediction Router (Section 5 & 6d).
POST /api/predict/task-time
"""

from fastapi import APIRouter, HTTPException, status
from app.schemas.prediction import PredictTaskTimeRequest, PredictTaskTimeResponse
from app.services.predictor import predictor_service

router = APIRouter(prefix="/api/predict", tags=["Predictions"])


@router.post(
    "/task-time",
    response_model=PredictTaskTimeResponse,
    summary="Predict task completion duration",
    description="Runs the trained Random Forest regression model on task type, weather, operator skill, and machine age."
)
async def predict_task_time(request: PredictTaskTimeRequest):
    try:
        prediction = predictor_service.predict(
            task_type=request.task_type,
            weather=request.weather,
            operator_skill=request.operator_skill,
            machine_age_yrs=request.machine_age_yrs,
            estimated_time_min=request.estimated_time_min
        )
        return PredictTaskTimeResponse(**prediction)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction error: {str(e)}"
        )
