"""Training modules, recommendations, and assignments router."""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.training import TrainingModule, TrainingAssignment
from app.models.behavior import BehaviorFlag
from app.schemas.training import (
    TrainingModuleOut,
    TrainingRecommendationsResponse,
    TrainingAssignmentCreate,
    TrainingAssignmentOut
)

router = APIRouter(prefix="/training", tags=["Training"])

FLAG_TO_TAG_MAP = {
    "excessive idling": ["idling", "fuel_efficiency", "engine"],
    "fuel inefficiency": ["fuel_efficiency", "engine", "smooth_operation"],
    "low productivity": ["productivity", "cycle_time", "loading"],
    "critical safety pattern": ["safety", "seatbelt", "proximity"],
    "fatigue risk": ["fatigue", "safety", "wellness", "shift_management"],
    "hard braking": ["braking", "smooth_operation", "safety"]
}

@router.get("/recommendations", response_model=TrainingRecommendationsResponse)
def get_recommendations(
    operator_id: str = Query(..., description="Operator ID e.g. OP1001"),
    db: Session = Depends(get_db)
):
    """
    Looks at operator's recent behavior flags, matches them to relevant training modules
    by topic tags, and returns personalized short-clip suggestions.
    """
    recent_flags = (
        db.query(BehaviorFlag)
        .filter(BehaviorFlag.operator_id == operator_id)
        .order_by(BehaviorFlag.timestamp.desc())
        .limit(5)
        .all()
    )

    flag_descriptions = []
    matched_tags = set()

    for f in recent_flags:
        desc = f"{f.flag_type} ({f.risk_level} risk): {f.details or ''}".strip()
        flag_descriptions.append(desc)
        f_type_lower = (f.flag_type or "").lower()
        for key, tags in FLAG_TO_TAG_MAP.items():
            if key in f_type_lower:
                matched_tags.update(tags)

    if not flag_descriptions:
        flag_descriptions.append("Routine skill enhancement & safety refresher")
        matched_tags.update(["safety", "smooth_operation", "productivity"])

    # Query matching modules
    all_modules = db.query(TrainingModule).all()
    recommended = []

    for m in all_modules:
        m_tags = [t.lower() for t in (m.topic_tags or [])]
        if any(tag in matched_tags for tag in m_tags) or not matched_tags:
            recommended.append(m)

    if not recommended:
        recommended = all_modules[:3]

    return TrainingRecommendationsResponse(
        flags=flag_descriptions,
        recommended_modules=[TrainingModuleOut.model_validate(m) for m in recommended]
    )

@router.get("/modules", response_model=List[TrainingModuleOut])
def list_modules(
    topic: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all training modules with optional search and topic filtering."""
    modules = db.query(TrainingModule).all()
    filtered = []

    for m in modules:
        if topic:
            tags = [t.lower() for t in (m.topic_tags or [])]
            if topic.lower() not in tags:
                continue
        if search:
            s = search.lower()
            title = (m.title or "").lower()
            if s not in title:
                continue
        filtered.append(m)

    return [TrainingModuleOut.model_validate(m) for m in filtered]

@router.post("/modules", response_model=TrainingModuleOut, status_code=status.HTTP_201_CREATED)
def create_module(
    module_id: str,
    title: str,
    topic_tags: List[str],
    video_url: str,
    duration_sec: int,
    db: Session = Depends(get_db)
):
    """Create a new training module."""
    mod = TrainingModule(
        module_id=module_id,
        title=title,
        topic_tags=topic_tags,
        video_url=video_url,
        duration_sec=duration_sec
    )
    db.add(mod)
    db.commit()
    db.refresh(mod)
    return TrainingModuleOut.model_validate(mod)

@router.post("/assign")
def assign_module(payload: TrainingAssignmentCreate, db: Session = Depends(get_db)):
    """
    Records that a specific training module was pushed to an operator with a reason.
    """
    assignment = TrainingAssignment(
        operator_id=payload.operator_id,
        module_id=payload.module_id,
        reason=payload.reason,
        assigned_at=datetime.utcnow(),
        completed=False
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return {
        "assignment_id": assignment.assignment_id,
        "status": "assigned"
    }

@router.get("/assignments", response_model=List[TrainingAssignmentOut])
def list_assignments(
    operator_id: Optional[str] = None,
    completed: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """List assigned modules for operators."""
    query = db.query(TrainingAssignment)
    if operator_id:
        query = query.filter(TrainingAssignment.operator_id == operator_id)
    if completed is not None:
        query = query.filter(TrainingAssignment.completed == completed)

    assignments = query.order_by(TrainingAssignment.assigned_at.desc()).all()
    results = []
    for a in assignments:
        mod_title = a.module.title if a.module else None
        item = TrainingAssignmentOut(
            assignment_id=a.assignment_id,
            operator_id=a.operator_id,
            module_id=a.module_id,
            reason=a.reason,
            assigned_at=a.assigned_at,
            completed=a.completed or False,
            module_title=mod_title
        )
        results.append(item)
    return results

@router.patch("/assignments/{assignment_id}/complete")
def complete_assignment(assignment_id: int, db: Session = Depends(get_db)):
    """Mark an assigned training module as completed."""
    assignment = db.query(TrainingAssignment).filter(TrainingAssignment.assignment_id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    assignment.completed = True
    db.commit()
    return {"success": True, "assignment_id": assignment_id, "completed": True}
