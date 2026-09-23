"""Voice Assistant Pydantic schemas."""
from typing import Optional, Dict, Any
from pydantic import BaseModel

class AssistantQueryRequest(BaseModel):
    operator_id: str
    text: str
    machine_id: Optional[str] = None

class AssistantQueryResponse(BaseModel):
    intent: str
    reply_text: str
    data: Optional[Dict[str, Any]] = None

class ManualQueryRequest(BaseModel):
    machine_id: str
    question: str

class ManualQueryResponse(BaseModel):
    answer: str
    source_manual: str
