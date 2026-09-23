"""Training Pydantic schemas."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class TrainingModuleOut(BaseModel):
    module_id: str
    title: str
    topic_tags: Optional[List[str]] = []
    video_url: Optional[str] = None
    duration_sec: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

class TrainingRecommendationsResponse(BaseModel):
    flags: List[str]
    recommended_modules: List[TrainingModuleOut]

class TrainingAssignmentCreate(BaseModel):
    operator_id: str
    module_id: str
    reason: str

class TrainingAssignmentOut(BaseModel):
    assignment_id: int
    operator_id: str
    module_id: str
    reason: Optional[str] = None
    assigned_at: Optional[datetime] = None
    completed: bool = False
    module_title: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
