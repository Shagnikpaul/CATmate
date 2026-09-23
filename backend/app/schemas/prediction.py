"""
Task Completion Time Prediction Schemas (Section 5 & 6d).
"""

from typing import Optional, Literal
from pydantic import BaseModel, Field


class PredictTaskTimeRequest(BaseModel):
    task_type: str = Field(..., example="Trenching", description="Type of machine task")
    weather: str = Field(default="Sunny", example="Rainy", description="Site weather conditions")
    operator_skill: str = Field(default="Intermediate", example="Intermediate", description="Operator skill level: Beginner, Intermediate, or Expert")
    machine_age_yrs: float = Field(default=3.0, example=4, description="Age of machine in years")
    estimated_time_min: Optional[int] = Field(default=None, example=45, description="Initial manager baseline estimate in minutes")


class PredictTaskTimeResponse(BaseModel):
    predicted_time_min: int = Field(..., example=52, description="ML forecast duration in minutes")
    baseline_estimate_min: int = Field(..., example=45, description="Baseline estimate in minutes")
    confidence: Literal["high", "medium", "low"] = Field(..., example="medium", description="Prediction confidence tier")
