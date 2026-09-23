"""
Voice Assistant and Manual RAG Schemas (Section 5 & 6e).
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AssistantQueryRequest(BaseModel):
    operator_id: Optional[str] = Field(default="OP1001", example="OP1001", description="Operator ID")
    text: str = Field(..., example="what's on my plate today", description="Spoken transcription from operator")


class AssistantQueryResponse(BaseModel):
    intent: str = Field(..., example="daily_tasks", description="Classified intent")
    reply_text: str = Field(..., example="You've got 3 tasks today — excavation's done, loading's in progress at Bay 2.", description="Spoken speech response")
    confidence: Optional[float] = Field(default=0.9, description="Intent confidence score")
    data: Dict[str, Any] = Field(default_factory=dict, description="Contextual payload (task IDs, machine status, etc.)")


class ManualQueryRequest(BaseModel):
    machine_id: Optional[str] = Field(default=None, example="EXC001", description="Current machine ID")
    question: str = Field(..., example="how do I check hydraulic fluid level", description="Technical question from operator")
    top_k: Optional[int] = Field(default=3, description="Number of manual passages to retrieve")


class ManualQueryResponse(BaseModel):
    answer: str = Field(..., example="Locate the sight gauge on the left side of the hydraulic tank...", description="Synthesized manual answer")
    source_manual: str = Field(..., example="320 Excavator Operation Manual, p.42", description="Exact manual citation with page number")
    retrieved_chunks: Optional[List[Dict[str, Any]]] = Field(default=None, description="Raw retrieved passages for inspection")
