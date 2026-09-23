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

from app.services.llm_service import llm_service

router = APIRouter(prefix="/incidents", tags=["Incidents"])


@router.post("", response_model=IncidentCreateResponse, status_code=status.HTTP_201_CREATED)
def create_incident(payload: IncidentCreate, db: Session = Depends(get_db)):
    """
    Takes raw transcript from operator's spoken report (and optional photo),
    structures the incident fields via Groq LLM, saves to database, and returns confirmation.
    """
    structured_data = llm_service.structure_incident(payload.raw_text)
    structured = IncidentStructured(
        type=structured_data.get("type", "General Equipment Issue"),
        location=structured_data.get("location", "Machine Work Zone"),
        severity=structured_data.get("severity", "Medium")
    )
    
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
