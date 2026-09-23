"""Incident Pydantic schemas."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class IncidentCreate(BaseModel):
    operator_id: str
    machine_id: str
    raw_text: str
    photo_base64: Optional[str] = None
    photo_url: Optional[str] = None

class IncidentStructured(BaseModel):
    type: str
    location: str
    severity: str

class IncidentCreateResponse(BaseModel):
    incident_id: str
    structured: IncidentStructured
    timestamp: str

class IncidentOut(BaseModel):
    incident_id: str
    operator_id: Optional[str] = None
    machine_id: Optional[str] = None
    raw_voice_text: Optional[str] = None
    incident_type: Optional[str] = None
    location: Optional[str] = None
    severity: Optional[str] = None
    photo_url: Optional[str] = None
    timestamp: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class IncidentListResponse(BaseModel):
    incidents: List[IncidentOut]
