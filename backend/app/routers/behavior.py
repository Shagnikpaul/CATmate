"""Behavior flags and fatigue detection router."""
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.behavior import BehaviorFlag
from app.schemas.behavior import (
    BehaviorFlagOut,
    BehaviorFlagsResponse,
    BehaviorEvaluateRequest
)
from app.services.rule_engine import evaluate_operator_telemetry

router = APIRouter(prefix="/behavior", tags=["Behavior Detection"])

@router.get("/flags", response_model=BehaviorFlagsResponse)
def get_behavior_flags(
    operator_id: Optional[str] = Query(None, description="Operator ID e.g. OP1001"),
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    db: Session = Depends(get_db)
):
    """
    Returns behavior and fatigue flags for an operator / date.
    Feeds the Training Hub, Manager Overview badges, and wellness assistant.
    """
    query = db.query(BehaviorFlag)
    if operator_id:
        query = query.filter(BehaviorFlag.operator_id == operator_id)
    if date:
        try:
            target_date = datetime.strptime(date, "%Y-%m-%d").date()
            query = query.filter(func.date(BehaviorFlag.timestamp) == target_date)
        except Exception:
            pass

    flags = query.order_by(BehaviorFlag.timestamp.desc()).all()

    # If no flags exist yet for this operator, run rule engine on telemetry
    if not flags and operator_id:
        flags = evaluate_operator_telemetry(db, operator_id, date)

    return BehaviorFlagsResponse(
        flags=[BehaviorFlagOut.model_validate(f) for f in flags]
    )

@router.post("/evaluate", response_model=BehaviorFlagsResponse)
def trigger_evaluation(payload: BehaviorEvaluateRequest, db: Session = Depends(get_db)):
    """
    Manually triggers the rule engine across telemetry data to generate flags.
    """
    flags = evaluate_operator_telemetry(db, payload.operator_id or "OP1001", payload.date)
    return BehaviorFlagsResponse(
        flags=[BehaviorFlagOut.model_validate(f) for f in flags]
    )
