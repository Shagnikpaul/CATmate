"""Manager dashboard and allocation Pydantic schemas."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class OperatorOverview(BaseModel):
    operator_id: str
    name: str
    active_task: Optional[str] = "Idle"
    machine_id: Optional[str] = None
    pace_status: str = "on_track"  # on_track / behind / idle
    flags_today: int = 0

class ManagerOverviewResponse(BaseModel):
    tasks_today: int
    incidents_today: int
    operators: List[OperatorOverview]

class ManagerTaskCreate(BaseModel):
    machine_id: str
    operator_id: str
    task_type: str
    zone: str
    scheduled_start: Optional[str] = "08:00"
    estimated_time_min: int

class ManagerFeedItem(BaseModel):
    id: str
    item_type: str  # incident / behavior_flag
    operator_id: Optional[str] = None
    operator_name: Optional[str] = None
    machine_id: Optional[str] = None
    title: str
    severity_or_risk: str  # Low / Medium / High
    details: str
    timestamp: Optional[datetime] = None

class ManagerFeedResponse(BaseModel):
    total: int
    feed: List[ManagerFeedItem]
