"""Telemetry simulation service for live machine readings and proximity alerts."""
import random
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.telemetry import Telemetry
from app.models.machine import Machine

def get_live_machine_status(db: Session, machine_id: str) -> Dict[str, Any]:
    """
    Get the latest live readings for a machine.
    Checks latest database telemetry record or synthesizes realistic continuous readings.
    """
    latest_telemetry = (
        db.query(Telemetry)
        .filter(Telemetry.machine_id == machine_id)
        .order_by(Telemetry.timestamp.desc())
        .first()
    )

    if latest_telemetry:
        engine_hours = round(latest_telemetry.engine_hours or 1420.5, 1)
        seatbelt_status = latest_telemetry.seatbelt_status or "Fastened"
        safety_alert = latest_telemetry.safety_alert_triggered or False
        # Calculate fuel level percentage (derived from fuel used or base default)
        fuel_pct = max(15.0, min(100.0, 85.0 - ((latest_telemetry.fuel_used_l or 20) % 70)))
    else:
        engine_hours = 1524.8
        seatbelt_status = "Fastened"
        safety_alert = False
        fuel_pct = 68.0

    return {
        "machine_id": machine_id,
        "engine_hours": engine_hours,
        "fuel_level_pct": round(fuel_pct, 1),
        "seatbelt_status": seatbelt_status,
        "proximity_alert": {"hazard": "Object detected", "distance_m": 2.5} if safety_alert else None,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

def simulate_proximity_hazard(machine_id: str) -> Dict[str, Any]:
    """Generate a synthetic proximity hazard reading for demonstration."""
    directions = ["left", "right", "rear", "front-left", "front-right"]
    return {
        "object_detected": True,
        "distance_m": round(random.uniform(1.2, 3.5), 1),
        "direction": random.choice(directions)
    }
