"""Prediction Pydantic schemas."""
from typing import Optional
from pydantic import BaseModel

class TaskTimePredictRequest(BaseModel):
    task_type: str
    weather: str
    operator_skill: str
    machine_age_yrs: int
    estimated_time_min: Optional[int] = 45

class TaskTimePredictResponse(BaseModel):
    predicted_time_min: int
    baseline_estimate_min: int
    confidence: str  # low / medium / high
