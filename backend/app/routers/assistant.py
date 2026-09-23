"""
Voice Assistant and Manual RAG Endpoints (Section 5 & 6e).
Mounted under /api:
POST /api/assistant/query
POST /api/assistant/manual-query
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.task import Task
from app.models.telemetry import Telemetry
from app.schemas.assistant import (
    AssistantQueryRequest,
    AssistantQueryResponse,
    ManualQueryRequest,
    ManualQueryResponse,
)
from app.services.llm_service import llm_service
from app.services.rag_service import rag_service

router = APIRouter(prefix="/assistant", tags=["Assistant"])


@router.post(
    "/query",
    response_model=AssistantQueryResponse,
    summary="Spoken voice intent query router",
    description="Classifies operator spoken voice and routes to relevant data or conversational response."
)
async def assistant_query(
    request: AssistantQueryRequest,
    db: Session = Depends(get_db)
):
    try:
        classification = llm_service.classify_intent(request.text)
        intent = classification.get("intent", "small_talk")
        reply_text = classification.get("reply_text", "Understood.")
        data = classification.get("data", {})

        # Contextual enrichment based on classified intent
        if intent == "daily_tasks" and request.operator_id:
            tasks = (
                db.query(Task)
                .filter(Task.operator_id == request.operator_id)
                .order_by(Task.scheduled_start.asc())
                .all()
            )
            if tasks:
                data["task_ids"] = [t.task_id for t in tasks]
                completed = [t.task_type for t in tasks if t.status == "completed"]
                in_prog = [t.task_type for t in tasks if t.status == "in_progress"]
                pending = [t.task_type for t in tasks if t.status == "pending"]

                parts = []
                if completed:
                    parts.append(f"{', '.join(completed)} completed")
                if in_prog:
                    parts.append(f"{', '.join(in_prog)} in progress")
                if pending:
                    parts.append(f"{', '.join(pending)} pending")

                status_summary = "; ".join(parts) if parts else "queued for your shift"
                reply_text = f"You've got {len(tasks)} tasks today — {status_summary}."

        elif intent == "machine_status" and request.operator_id:
            latest_tel = (
                db.query(Telemetry)
                .filter(Telemetry.operator_id == request.operator_id)
                .order_by(Telemetry.timestamp.desc())
                .first()
            )
            if latest_tel:
                data["machine_id"] = latest_tel.machine_id
                data["engine_hours"] = latest_tel.engine_hours
                data["seatbelt_status"] = latest_tel.seatbelt_status
                data["safety_alert_triggered"] = latest_tel.safety_alert_triggered
                reply_text = (
                    f"Machine {latest_tel.machine_id}: {latest_tel.engine_hours:.1f} engine hours, "
                    f"seatbelt is {latest_tel.seatbelt_status}."
                )

        return AssistantQueryResponse(
            intent=intent,
            reply_text=reply_text,
            confidence=classification.get("confidence", 0.95),
            data=data
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Assistant processing error: {str(e)}"
        )


@router.post(
    "/manual-query",
    response_model=ManualQueryResponse,
    summary="RAG query over CAT machine operator manuals",
    description="Embeds operator question, retrieves relevant manual passages from FAISS, and synthesizes grounded answer with citations."
)
async def assistant_manual_query(request: ManualQueryRequest):
    try:
        # 1. Retrieve top-k chunks from FAISS index
        chunks = rag_service.search(
            query=request.question,
            top_k=request.top_k or 3,
            manual_id=request.machine_id
        )

        # 2. Synthesize grounded answer
        rag_answer = llm_service.answer_manual_question(
            question=request.question,
            context_chunks=chunks,
            machine_model=request.machine_id
        )

        return ManualQueryResponse(
            answer=rag_answer["answer"],
            source_manual=rag_answer["source_manual"],
            retrieved_chunks=chunks
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Manual RAG query error: {str(e)}"
        )
