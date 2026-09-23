"""Machines and live status router."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.machine import Machine
from app.schemas.machine import (
    MachineOut,
    MachineStatusResponse,
    ProximitySimulateRequest,
    ProximitySimulateResponse
)
from app.services.telemetry_simulator import get_live_machine_status, simulate_proximity_hazard

router = APIRouter(tags=["Machines"])

@router.get("/machines", response_model=List[MachineOut])
def list_machines(db: Session = Depends(get_db)):
    """List all machines across sites."""
    return db.query(Machine).all()

@router.get("/machines/{machine_id}", response_model=MachineOut)
def get_machine(machine_id: str, db: Session = Depends(get_db)):
    """Get single machine details."""
    machine = db.query(Machine).filter(Machine.machine_id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Machine not found")
    return machine

@router.get("/machines/{machine_id}/status", response_model=MachineStatusResponse)
def get_machine_status(machine_id: str, db: Session = Depends(get_db)):
    """
    Returns the machine's current live readings (seatbelt, fuel, engine hours, proximity).
    The frontend polls this on an interval to trigger ambient voice alerts.
    """
    machine = db.query(Machine).filter(Machine.machine_id == machine_id).first()
    if not machine:
        # Create or allow default machine reading
        pass

    return get_live_machine_status(db, machine_id)

@router.post("/proximity/simulate", response_model=ProximitySimulateResponse)
def simulate_proximity(payload: ProximitySimulateRequest):
    """
    Generates a synthetic proximity-hazard reading for a machine so the demo
    can showcase real-time 'object detected' voice alerts.
    """
    return simulate_proximity_hazard(payload.machine_id)
