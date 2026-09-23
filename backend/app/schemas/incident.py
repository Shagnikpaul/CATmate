"""
Incident Reporting and Structuring Schemas (Section 5 & 6e).
"""

from typing import Optional, Literal
from pydantic import BaseModel, Field


class StructuredIncident(BaseModel):
    type: str = Field(..., example="Hydraulic Leak", description="Standardized incident classification")
    location: str = Field(..., example="Near Bucket", description="Machine or site location")
    severity: Literal["Low", "Medium", "High", "Critical"] = Field(..., example="Medium", description="Assessed severity")
    description: Optional[str] = Field(default=None, description="Concise description")


class CreateIncidentRequest(BaseModel):
    operator_id: str = Field(..., example="OP1001", description="Operator identifier")
    machine_id: str = Field(..., example="EXC001", description="Machine identifier")
    raw_text: str = Field(..., example="hydraulic leak near the bucket", description="Spoken transcription")
    photo_base64: Optional[str] = Field(default=None, description="Optional photo in base64")


class CreateIncidentResponse(BaseModel):
    incident_id: str = Field(..., example="INC0042", description="Unique incident identifier")
    structured: StructuredIncident = Field(..., description="LLM-extracted structured details")
    timestamp: str = Field(..., example="2026-09-23T10:15:00Z", description="Timestamp of recording")
