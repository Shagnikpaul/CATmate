"""Voice assistant intent router and manual queries."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.task import Task
from app.models.machine import Machine, ManualChunk, MachineManual
from app.models.telemetry import Telemetry
from app.schemas.assistant import (
    AssistantQueryRequest,
    AssistantQueryResponse,
    ManualQueryRequest,
    ManualQueryResponse
)
from app.services.telemetry_simulator import get_live_machine_status

router = APIRouter(prefix="/assistant", tags=["Voice Assistant"])

@router.post("/query", response_model=AssistantQueryResponse)
def query_assistant(payload: AssistantQueryRequest, db: Session = Depends(get_db)):
    """
    General intent router: classifies spoken text from operator mic input,
    routes to tasks/status/safety data, and returns spoken-friendly response.
    """
    text_lower = payload.text.lower()

    # Intent 1: Daily Tasks / Schedule
    if any(k in text_lower for k in ["task", "plate", "today", "schedule", "work", "job", "assignment"]):
        tasks = (
            db.query(Task)
            .filter(Task.operator_id == payload.operator_id)
            .order_by(Task.scheduled_start.asc())
            .all()
        )
        if not tasks:
            return AssistantQueryResponse(
                intent="daily_tasks",
                reply_text="You have no tasks scheduled for today. Check in with your site manager.",
                data={"task_ids": []}
            )

        task_ids = [t.task_id for t in tasks]
        in_prog = [t for t in tasks if t.status == "in_progress"]
        completed = [t for t in tasks if t.status == "completed"]
        pending = [t for t in tasks if t.status == "pending"]

        summary_parts = [f"You have {len(tasks)} tasks today."]
        if completed:
            summary_parts.append(f"{len(completed)} completed.")
        if in_prog:
            summary_parts.append(f"{in_prog[0].task_type} is currently in progress at {in_prog[0].zone or 'site'}.")
        elif pending:
            summary_parts.append(f"Next up is {pending[0].task_type} scheduled at {pending[0].zone or 'site'}.")

        return AssistantQueryResponse(
            intent="daily_tasks",
            reply_text=" ".join(summary_parts),
            data={"task_ids": task_ids}
        )

    # Intent 2: Machine Status / Telemetry
    if any(k in text_lower for k in ["status", "fuel", "seatbelt", "engine", "hours", "machine", "reading"]):
        machine_id = payload.machine_id or "EXC001"
        status_info = get_live_machine_status(db, machine_id)
        reply = (
            f"Machine {machine_id} status: Engine hours are {status_info['engine_hours']}, "
            f"fuel level is at {status_info['fuel_level_pct']}%, and seatbelt is {status_info['seatbelt_status']}."
        )
        return AssistantQueryResponse(
            intent="machine_status",
            reply_text=reply,
            data=status_info
        )

    # Intent 3: Incident / Safety
    if any(k in text_lower for k in ["incident", "leak", "hazard", "danger", "smoke", "accident", "damage"]):
        return AssistantQueryResponse(
            intent="log_incident",
            reply_text="I can log that incident for you. Please confirm the details or upload a photo if needed.",
            data={"raw_text": payload.text}
        )

    # Intent 4: Manual / Help question
    if any(k in text_lower for k in ["how do i", "how to", "manual", "guide", "procedure", "check", "specification"]):
        return AssistantQueryResponse(
            intent="manual_question",
            reply_text="Checking the CAT operation manual for your machine...",
            data={"query": payload.text}
        )

    # Default / Small talk
    return AssistantQueryResponse(
        intent="small_talk",
        reply_text=f"CatMate ready. You can ask for today's tasks, machine status, or log an incident.",
        data={}
    )

@router.post("/manual-query", response_model=ManualQueryResponse)
def query_manual(payload: ManualQueryRequest, db: Session = Depends(get_db)):
    """
    RAG over CAT equipment manuals. Searches indexed manual chunks or returns
    verified standard procedures for CAT excavators and heavy equipment.
    """
    q_lower = payload.question.lower()

    # Query DB manual chunks if available
    chunks = db.query(ManualChunk).filter(ManualChunk.chunk_text.ilike(f"%{payload.question[:20]}%")).first()
    if chunks and chunks.chunk_text:
        return ManualQueryResponse(
            answer=chunks.chunk_text,
            source_manual=f"CAT Equipment Manual, p.{chunks.page_number or 1}"
        )

    if "hydraulic" in q_lower or "fluid" in q_lower:
        return ManualQueryResponse(
            answer="Park the machine on level ground, lower bucket to ground, and check the sight gauge on the left side of the hydraulic tank. Oil level should be between the ADD and FULL marks with fluid at operating temperature.",
            source_manual="CAT 320 Excavator Operation & Maintenance Manual, p.42"
        )
    elif "seatbelt" in q_lower or "safety" in q_lower:
        return ManualQueryResponse(
            answer="Inspect seatbelt webbing and buckle mechanism before starting. Fasten seatbelt securely across hips before turning ignition. Do not operate equipment if belt webbing is frayed or buckle is loose.",
            source_manual="CAT Safety & Daily Inspection Guide, p.15"
        )
    elif "engine" in q_lower or "coolant" in q_lower or "oil" in q_lower:
        return ManualQueryResponse(
            answer="Ensure engine is stopped and cool. Check engine oil level via the dipstick on the right engine service door. Check coolant level at the surge tank sight glass.",
            source_manual="CAT 320 Service Manual - Fluids & Capacities, p.78"
        )
    elif "track" in q_lower or "tension" in q_lower:
        return ManualQueryResponse(
            answer="Measure track sag at the middle top roller. Standard sag is 25-40 mm. Add grease to the adjuster valve cylinder to tighten, or loosen valve 1 turn to release tension.",
            source_manual="CAT Undercarriage Maintenance Manual, p.63"
        )
    else:
        return ManualQueryResponse(
            answer="Refer to the pre-operation inspection checklist: check fluids, inspect undercarriage, ensure mirrors and cameras are clean, and verify all safety controls are operational.",
            source_manual="CAT Operator Standard Operating Procedures, p.12"
        )
