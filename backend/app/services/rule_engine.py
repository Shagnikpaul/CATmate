"""Rule engine for behavior and fatigue detection from operator telemetry."""
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.telemetry import Telemetry
from app.models.behavior import BehaviorFlag

def evaluate_operator_telemetry(
    db: Session,
    operator_id: str,
    target_date: Optional[str] = None
) -> List[BehaviorFlag]:
    """
    Evaluates telemetry data for an operator using the 5 PRD rule-engine heuristics.
    Persists new behavior flags to the database if not already logged.
    """
    query = db.query(Telemetry).filter(Telemetry.operator_id == operator_id)
    if target_date:
        try:
            date_obj = datetime.strptime(target_date, "%Y-%m-%d").date()
            query = query.filter(func.date(Telemetry.timestamp) == date_obj)
        except Exception:
            pass

    records = query.order_by(Telemetry.timestamp.asc()).all()
    if not records:
        # Return existing flags if no raw records in range
        return db.query(BehaviorFlag).filter(BehaviorFlag.operator_id == operator_id).all()

    # Calculate operator baseline averages
    total_fuel = sum(r.fuel_used_l or 0.0 for r in records)
    total_cycles = sum(r.load_cycles or 0 for r in records)
    avg_fuel_per_cycle = (total_fuel / total_cycles) if total_cycles > 0 else 5.0

    generated_flags = []

    for r in records:
        machine_id = r.machine_id or "EXC001"
        ts = r.timestamp or datetime.utcnow()
        idling = r.idling_time_min or 0
        cycles = r.load_cycles or 0
        fuel = r.fuel_used_l or 0.0
        seatbelt = (r.seatbelt_status or "Fastened").lower()
        alert = bool(r.safety_alert_triggered)

        # Rule 1: Excessive Idling (> 45 min)
        if idling > 45:
            flag = BehaviorFlag(
                operator_id=operator_id,
                machine_id=machine_id,
                flag_type="Excessive Idling",
                risk_level="Medium",
                details=f"Continuous idling recorded at {idling} min (threshold: 45 min).",
                timestamp=ts
            )
            generated_flags.append(flag)

        # Rule 2: Fuel Inefficiency (> 1.5x avg)
        fuel_per_cycle = (fuel / cycles) if cycles > 0 else fuel
        if fuel_per_cycle > (1.5 * avg_fuel_per_cycle) and fuel > 15:
            flag = BehaviorFlag(
                operator_id=operator_id,
                machine_id=machine_id,
                flag_type="Fuel Inefficiency",
                risk_level="Low",
                details=f"Fuel consumption {fuel_per_cycle:.1f} L/cycle exceeds 1.5x operator baseline ({avg_fuel_per_cycle:.1f} L/cycle).",
                timestamp=ts
            )
            generated_flags.append(flag)

        # Rule 3: Low Productivity (Cycles < 3 AND Idling > 30)
        if cycles < 3 and idling > 30:
            flag = BehaviorFlag(
                operator_id=operator_id,
                machine_id=machine_id,
                flag_type="Low Productivity",
                risk_level="Medium",
                details=f"Only {cycles} cycles completed with {idling} min idling time in evaluation window.",
                timestamp=ts
            )
            generated_flags.append(flag)

        # Rule 4: Critical Safety Pattern (Unfastened + Alert)
        if seatbelt == "unfastened" and alert:
            flag = BehaviorFlag(
                operator_id=operator_id,
                machine_id=machine_id,
                flag_type="Critical Safety Pattern",
                risk_level="High",
                details="Proximity safety alert triggered while seatbelt was unfastened.",
                timestamp=ts
            )
            generated_flags.append(flag)

        # Rule 5: Fatigue Risk (composite >= 2 conditions)
        fatigue_conditions = 0
        fatigue_reasons = []
        if idling >= 40:
            fatigue_conditions += 1
            fatigue_reasons.append(f"Idling {idling}min")
        if ts.hour >= 14 or ts.hour <= 5:  # Late shift or early dawn
            fatigue_conditions += 1
            fatigue_reasons.append(f"Late-shift timestamp ({ts.strftime('%H:%M')})")
        if seatbelt == "unfastened" or alert:
            fatigue_conditions += 1
            fatigue_reasons.append("Safety vigilance drop")

        if fatigue_conditions >= 2:
            flag = BehaviorFlag(
                operator_id=operator_id,
                machine_id=machine_id,
                flag_type="Fatigue Risk",
                risk_level="High" if fatigue_conditions >= 3 else "Medium",
                details=f"{' + '.join(fatigue_reasons)} ({fatigue_conditions}/3 conditions met).",
                timestamp=ts
            )
            generated_flags.append(flag)

    # Save newly detected flags if not already logged
    for flag in generated_flags:
        existing = db.query(BehaviorFlag).filter(
            BehaviorFlag.operator_id == flag.operator_id,
            BehaviorFlag.flag_type == flag.flag_type,
            func.date(BehaviorFlag.timestamp) == flag.timestamp.date()
        ).first()
        if not existing:
            db.add(flag)

    db.commit()

    # Return all flags for the operator
    return db.query(BehaviorFlag).filter(BehaviorFlag.operator_id == operator_id).order_by(BehaviorFlag.timestamp.desc()).all()
