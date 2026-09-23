"""Task Pydantic schemas."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class TaskCreate(BaseModel):
    task_id: Optional[str] = None
    machine_id: str
    operator_id: str
    task_type: str
    zone: str
    scheduled_start: Optional[datetime] = None
    estimated_time_min: int
    weather: Optional[str] = "Sunny"

class TaskUpdate(BaseModel):
    status: Optional[str] = None
    actual_time_min: Optional[int] = None
    estimated_time_min: Optional[int] = None
    weather: Optional[str] = None
    zone: Optional[str] = None

class TaskOut(BaseModel):
    task_id: str
    machine_id: Optional[str] = None
    operator_id: Optional[str] = None
    task_type: Optional[str] = None
    zone: Optional[str] = None
    scheduled_start: Optional[datetime] = None
    estimated_time_min: Optional[int] = None
    actual_time_min: Optional[int] = None
    weather: Optional[str] = None
    status: Optional[str] = "pending"

    model_config = ConfigDict(from_attributes=True)

class TodayTaskItem(BaseModel):
    task_id: str
    task_type: str
    zone: str
    scheduled_start: Optional[str] = None
    estimated_time_min: Optional[int] = None
    actual_time_min: Optional[int] = None
    status: str
    machine_id: Optional[str] = None

class ConditionsOut(BaseModel):
    weather: str
    hazards: List[str]

class TodayTasksResponse(BaseModel):
    date: str
    conditions: ConditionsOut
    tasks: List[TodayTaskItem]
