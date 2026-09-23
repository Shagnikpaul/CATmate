"""Behavior and fatigue flag Pydantic schemas."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class BehaviorFlagOut(BaseModel):
    flag_id: Optional[int] = None
    operator_id: Optional[str] = None
    machine_id: Optional[str] = None
    flag_type: str
    risk_level: str
    details: str
    timestamp: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class BehaviorFlagsResponse(BaseModel):
    flags: List[BehaviorFlagOut]

class BehaviorEvaluateRequest(BaseModel):
    operator_id: Optional[str] = None
    date: Optional[str] = None
