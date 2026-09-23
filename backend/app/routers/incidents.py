"""Incidents CRUD and hands-free voice logging router."""
import random
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.incident import Incident
from app.schemas.incident import (
    IncidentCreate,
    IncidentStructured,
    IncidentCreateResponse,
    IncidentOut,
    IncidentListResponse
)

router = APIRouter(prefix="/incidents", tags=["Incidents"])

def parse_incident_text(raw_text: str) -> IncidentStructured:
    """Extract structured fields (type, location, severity) from raw transcript."""
    text_lower = raw_text.lower()

    # Determine Type
    if "hydraulic" in text_lower or "leak" in text_lower or "fluid" in text_lower:
        inc_type = "Hydraulic Leak"
    elif "engine" in text_lower or "smoke" in text_lower or "overheat" in text_lower:
        inc_type = "Engine Overheat / Smoke"
    elif "track" in text_lower or "tire" in text_lower or "wheel" in text_lower:
        inc_type = "Undercarriage / Track Issue"
    elif "brake" in text_lower or "braking" in text_lower:
        inc_type = "Braking System Anomaly"
    elif "electrical" in text_lower or "wire" in text_lower or "sensor" in text_lower:
        inc_type = "Electrical / Sensor Fault"
    elif "collision" in text_lower or "hit" in text_lower or "obstacle" in text_lower:
        inc_type = "Collision / Hazard Encounter"
    else:
        inc_type = "General Equipment Issue"

    # Determine Location
    if "bucket" in text_lower:
        location = "Near Bucket / Front Attachment"
    elif "cabin" in text_lower or "cab" in text_lower:
        location = "Operator Cabin"
    elif "engine" in text_lower or "hood" in text_lower or "rear" in text_lower:
        location = "Engine Compartment"
    elif "boom" in text_lower or "arm" in text_lower:
        location = "Main Boom Assembly"
    elif "trench" in text_lower or "zone" in text_lower or "bay" in text_lower:
        location = "Working Trench / Bay"
    else:
        location = "Site Perimeter"

    # Determine Severity
    if any(w in text_lower for w in ["fire", "smoke", "crash", "critical", "severe", "danger", "burst"]):
        severity = "High"
    elif any(w in text_lower for w in ["leak", "slip", "warning", "hot", "slow", "noise", "abnormal"]):
        severity = "Medium"
    else:
        severity = "Low"

    return IncidentStructured(type=inc_type, location=location, severity=severity)

@router.post("", response_model=IncidentCreateResponse, status_code=status.HTTP_201_CREATED)
def create_incident(payload: IncidentCreate, db: Session = Depends(get_db)):
    """
    Takes raw transcript from operator's spoken report (and optional photo),
    structures the incident fields, saves to database, and returns confirmation.
    """
    structured = parse_incident_text(payload.raw_text)
    
    # Generate realistic incident ID
    incident_num = random.randint(10, 999)
    incident_id = f"INC{incident_num:04d}"
    
    # Ensure ID uniqueness
    while db.query(Incident).filter(Incident.incident_id == incident_id).first():
        incident_num = random.randint(10, 9999)
        incident_id = f"INC{incident_num:04d}"

    now_dt = datetime.utcnow()
    incident_obj = Incident(
        incident_id=incident_id,
        operator_id=payload.operator_id,
        machine_id=payload.machine_id,
        raw_voice_text=payload.raw_text,
        incident_type=structured.type,
        location=structured.location,
        severity=structured.severity,
        photo_url=payload.photo_url or payload.photo_base64,
        timestamp=now_dt
    )

    db.add(incident_obj)
    db.commit()
    db.refresh(incident_obj)

    return IncidentCreateResponse(
        incident_id=incident_id,
        structured=structured,
        timestamp=now_dt.isoformat() + "Z"
    )

@router.get("", response_model=IncidentListResponse)
def list_incidents(
    operator_id: Optional[str] = None,
    machine_id: Optional[str] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Lists incidents filterable by operator_id, machine_id, and severity.
    """
    query = db.query(Incident)
    if operator_id:
        query = query.filter(Incident.operator_id == operator_id)
    if machine_id:
        query = query.filter(Incident.machine_id == machine_id)
    if severity:
        query = query.filter(Incident.severity.ilike(severity))

    results = query.order_by(Incident.timestamp.desc()).all()
    return IncidentListResponse(
        incidents=[IncidentOut.model_validate(inc) for inc in results]
    )

@router.get("/{incident_id}", response_model=IncidentOut)
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    """Get single incident details."""
    incident = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")
    return IncidentOut.model_validate(incident)

@router.delete("/{incident_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_incident(incident_id: str, db: Session = Depends(get_db)):
    """Delete an incident record."""
    incident = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")
    db.delete(incident)
    db.commit()
    return None
