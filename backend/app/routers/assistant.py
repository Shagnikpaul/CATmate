"""
Voice Assistant and Manual RAG Endpoints (Section 5 & 6e).
POST /api/assistant/query
POST /api/assistant/manual-query
"""

from fastapi import APIRouter, HTTPException, status
from app.schemas.assistant import (
    AssistantQueryRequest,
    AssistantQueryResponse,
    ManualQueryRequest,
    ManualQueryResponse,
)
from app.services.llm_service import llm_service
from app.services.rag_service import rag_service

router = APIRouter(prefix="/api/assistant", tags=["Assistant"])


@router.post(
    "/query",
    response_model=AssistantQueryResponse,
    summary="Spoken voice intent query router",
    description="Classifies operator spoken voice and routes to relevant data or conversational response."
)
async def assistant_query(request: AssistantQueryRequest):
    try:
        classification = llm_service.classify_intent(request.text)
        return AssistantQueryResponse(
            intent=classification["intent"],
            reply_text=classification["reply_text"],
            confidence=classification.get("confidence", 0.9),
            data=classification.get("data", {})
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
