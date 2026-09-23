"""Manager dashboard, overview, and task allocation router."""
import uuid
from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User
from app.models.task import Task
from app.models.incident import Incident
from app.models.behavior import BehaviorFlag
from app.models.machine import Machine
from app.schemas.manager import (
    ManagerOverviewResponse,
    OperatorOverview,
    ManagerTaskCreate,
    ManagerFeedItem,
    ManagerFeedResponse
)
from app.services.auth_service import get_optional_user

router = APIRouter(prefix="/manager", tags=["Manager"])

@router.get("/overview", response_model=ManagerOverviewResponse)
def get_manager_overview(
    site_id: Optional[str] = Query(None, description="Site ID e.g. SITE01"),
    db: Session = Depends(get_db)
):
    """
    Aggregates site metrics and every operator's active task, pace status,
    and flag count for the live manager grid.
    """
    today_date = date.today()

    # Total tasks & incidents today
    tasks_count = db.query(Task).count()
    incidents_count = db.query(Incident).count()

    # Query operators
    user_query = db.query(User).filter(User.role == "operator")
    if site_id:
        user_query = user_query.filter(User.site_id == site_id)
    operators = user_query.all()

    operator_overviews = []
    for op in operators:
        # Get active task
        active_task = (
            db.query(Task)
            .filter(Task.operator_id == op.user_id, Task.status == "in_progress")
            .first()
        )
        if not active_task:
            active_task = (
                db.query(Task)
                .filter(Task.operator_id == op.user_id, Task.status == "pending")
                .first()
            )

        task_title = "Idle / Available"
        machine_id = None
        pace_status = "on_track"

        if active_task:
            task_title = f"{active_task.task_type} ({active_task.zone})"
            machine_id = active_task.machine_id
            if active_task.actual_time_min and active_task.estimated_time_min:
                if active_task.actual_time_min > active_task.estimated_time_min:
                    pace_status = "behind"
                else:
                    pace_status = "on_track"
            elif active_task.status == "in_progress":
                pace_status = "on_track"
            else:
                pace_status = "scheduled"

        # Count flags for this operator
        flags_count = (
            db.query(BehaviorFlag)
            .filter(BehaviorFlag.operator_id == op.user_id)
            .count()
        )

        operator_overviews.append(
            OperatorOverview(
                operator_id=op.user_id,
                name=op.name,
                active_task=task_title,
                machine_id=machine_id,
                pace_status=pace_status,
                flags_today=flags_count
            )
        )

    return ManagerOverviewResponse(
        tasks_today=tasks_count,
        incidents_today=incidents_count,
        operators=operator_overviews
    )

@router.post("/tasks")
def allocate_task(payload: ManagerTaskCreate, db: Session = Depends(get_db)):
    """
    Allocates and schedules a new task for an operator/machine.
    """
    task_id = f"T{uuid.uuid4().hex[:4].upper()}"
    
    # Parse scheduled start
    sched_dt = datetime.utcnow()
    if payload.scheduled_start:
        try:
            parts = payload.scheduled_start.split(":")
            sched_dt = sched_dt.replace(hour=int(parts[0]), minute=int(parts[1]), second=0)
        except Exception:
            pass

    new_task = Task(
        task_id=task_id,
        machine_id=payload.machine_id,
        operator_id=payload.operator_id,
        task_type=payload.task_type,
        zone=payload.zone,
        scheduled_start=sched_dt,
        estimated_time_min=payload.estimated_time_min,
        weather="Sunny",
        status="pending"
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    return {
        "task_id": new_task.task_id,
        "status": "scheduled"
    }

@router.get("/feed", response_model=ManagerFeedResponse)
def get_manager_feed(
    operator_id: Optional[str] = None,
    severity: Optional[str] = None,
    item_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Combined feed of incidents and behavior flags for site review.
    Filterable by operator, severity/risk, and item type.
    """
    feed_items = []

    # Get incidents
    if item_type in [None, "incident"]:
        inc_query = db.query(Incident)
        if operator_id:
            inc_query = inc_query.filter(Incident.operator_id == operator_id)
        if severity:
            inc_query = inc_query.filter(Incident.severity.ilike(severity))
        for inc in inc_query.all():
            feed_items.append(
                ManagerFeedItem(
                    id=inc.incident_id,
                    item_type="incident",
                    operator_id=inc.operator_id,
                    operator_name=inc.operator.name if inc.operator else inc.operator_id,
                    machine_id=inc.machine_id or "N/A",
                    title=f"Incident: {inc.incident_type or 'General'}",
                    severity_or_risk=inc.severity or "Medium",
                    details=inc.raw_voice_text or inc.location or "No voice details",
                    timestamp=inc.timestamp
                )
            )

    # Get behavior flags
    if item_type in [None, "behavior_flag"]:
        flag_query = db.query(BehaviorFlag)
        if operator_id:
            flag_query = flag_query.filter(BehaviorFlag.operator_id == operator_id)
        if severity:
            flag_query = flag_query.filter(BehaviorFlag.risk_level.ilike(severity))
        for flag in flag_query.all():
            feed_items.append(
                ManagerFeedItem(
                    id=f"FLAG-{flag.flag_id}",
                    item_type="behavior_flag",
                    operator_id=flag.operator_id,
                    operator_name=flag.operator.name if flag.operator else flag.operator_id,
                    machine_id=flag.machine_id or "N/A",
                    title=f"Flag: {flag.flag_type or 'Behavior Warning'}",
                    severity_or_risk=flag.risk_level or "Low",
                    details=flag.details or "Flag condition triggered",
                    timestamp=flag.timestamp
                )
            )

    # Sort combined feed chronologically descending
    feed_items.sort(key=lambda x: x.timestamp or datetime.min, reverse=True)

    return ManagerFeedResponse(
        total=len(feed_items),
        feed=feed_items
    )

@router.get("/operators")
def list_operators(site_id: Optional[str] = None, db: Session = Depends(get_db)):
    """List all operator profiles."""
    query = db.query(User).filter(User.role == "operator")
    if site_id:
        query = query.filter(User.site_id == site_id)
    return query.all()
