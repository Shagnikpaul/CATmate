"""Tasks CRUD and Today's Schedule router."""
import uuid
from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.task import Task
from app.models.user import User
from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskOut,
    TodayTasksResponse,
    TodayTaskItem,
    ConditionsOut
)
from app.services.auth_service import get_optional_user

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("/today", response_model=TodayTasksResponse)
def get_today_tasks(
    operator_id: str = Query(..., description="Operator ID e.g. OP1001"),
    db: Session = Depends(get_db)
):
    """
    Powers the operator's home screen — returns today's scheduled tasks
    plus working conditions (weather/hazards).
    """
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    today_date = date.today()

    # Query tasks for this operator
    tasks_query = (
        db.query(Task)
        .filter(Task.operator_id == operator_id)
        .order_by(Task.scheduled_start.asc(), Task.task_id.asc())
        .all()
    )

    # Convert to response items
    task_items = []
    weather_summary = "Sunny"
    for t in tasks_query:
        if t.weather:
            weather_summary = t.weather
        sched_time = (
            t.scheduled_start.strftime("%H:%M")
            if t.scheduled_start
            else "08:00"
        )
        task_items.append(
            TodayTaskItem(
                task_id=t.task_id,
                task_type=t.task_type or "General Operation",
                zone=t.zone or "Main Yard",
                scheduled_start=sched_time,
                estimated_time_min=t.estimated_time_min or 45,
                actual_time_min=t.actual_time_min,
                status=t.status or "pending",
                machine_id=t.machine_id
            )
        )

    return TodayTasksResponse(
        date=today_str,
        conditions=ConditionsOut(
            weather=weather_summary,
            hazards=["loose soil near Trench 3", "haul road wet near Bay 2"]
        ),
        tasks=task_items
    )

@router.get("", response_model=List[TaskOut])
def list_tasks(
    operator_id: Optional[str] = None,
    machine_id: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    """List all tasks with optional filters."""
    query = db.query(Task)
    if operator_id:
        query = query.filter(Task.operator_id == operator_id)
    if machine_id:
        query = query.filter(Task.machine_id == machine_id)
    if status_filter:
        query = query.filter(Task.status == status_filter)

    return query.order_by(Task.scheduled_start.desc(), Task.task_id.desc()).all()

@router.get("/{task_id}", response_model=TaskOut)
def get_task(task_id: str, db: Session = Depends(get_db)):
    """Get single task details."""
    task = db.query(Task).filter(Task.task_id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task

@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(payload: TaskCreate, db: Session = Depends(get_db)):
    """Create a new scheduled task."""
    task_id = payload.task_id or f"T{uuid.uuid4().hex[:4].upper()}"
    
    new_task = Task(
        task_id=task_id,
        machine_id=payload.machine_id,
        operator_id=payload.operator_id,
        task_type=payload.task_type,
        zone=payload.zone,
        scheduled_start=payload.scheduled_start or datetime.utcnow(),
        estimated_time_min=payload.estimated_time_min,
        weather=payload.weather or "Sunny",
        status="pending"
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@router.patch("/{task_id}", response_model=TaskOut)
@router.patch("/{task_id}/status", response_model=TaskOut)
def update_task_status(
    task_id: str,
    payload: TaskUpdate,
    db: Session = Depends(get_db)
):
    """Update task lifecycle status (pending, in_progress, completed) or timings."""
    task = db.query(Task).filter(Task.task_id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if payload.status is not None:
        task.status = payload.status
    if payload.actual_time_min is not None:
        task.actual_time_min = payload.actual_time_min
    if payload.estimated_time_min is not None:
        task.estimated_time_min = payload.estimated_time_min
    if payload.weather is not None:
        task.weather = payload.weather
    if payload.zone is not None:
        task.zone = payload.zone

    db.commit()
    db.refresh(task)
    return task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: str, db: Session = Depends(get_db)):
    """Delete a task."""
    task = db.query(Task).filter(Task.task_id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    db.delete(task)
    db.commit()
    return None
