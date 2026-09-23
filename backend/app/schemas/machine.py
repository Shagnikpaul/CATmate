"""Machine Pydantic schemas."""
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict

class MachineOut(BaseModel):
    machine_id: str
    model: Optional[str] = None
    type: Optional[str] = None
    age_years: Optional[int] = None
    site_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class MachineStatusResponse(BaseModel):
    machine_id: str
    engine_hours: float
    fuel_level_pct: float
    seatbelt_status: str
    proximity_alert: Optional[Any] = None
    timestamp: str

class ProximitySimulateRequest(BaseModel):
    machine_id: str

class ProximitySimulateResponse(BaseModel):
    object_detected: bool
    distance_m: float
    direction: str
