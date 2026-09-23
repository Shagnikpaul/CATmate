"""
Groq LLM Service (Section 6e).
Provides:
1. Intent Routing (classify spoken operator audio into functional endpoints)
2. Incident Structuring (extract type, location, severity from raw speech)
3. Training Suggestion Copy (personalized in-cab coaching message)
4. Manual RAG Answer Generation (grounded synthesis citing official CAT manuals)

Includes an automated intelligent fallback engine that activates seamlessly
when GROQ_API_KEY is not set or network is offline, ensuring zero demo failures.
"""

import json
import os
import re
from typing import Any, Dict, List, Optional
from app.config import settings

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False


class GroqLLMService:
    """
    Client for Groq Llama 3.3/3.1 with intelligent rule-based fallback.
    """

    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self.client: Optional[Any] = None
        self.api_key: Optional[str] = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY")
        self.model: str = settings.GROQ_MODEL
        self.fallback_model: str = settings.GROQ_FALLBACK_MODEL

        self._init_client()
        self._initialized = True

    def _init_client(self) -> None:
        if GROQ_AVAILABLE and self.api_key and self.api_key.startswith("gsk_"):
            try:
                self.client = Groq(api_key=self.api_key)
                print(f"[GroqLLMService] Initialized with Groq API (Model: {self.model})")
            except Exception as e:
                print(f"[GroqLLMService] Error initializing Groq client: {e}. Fallback active.")
                self.client = None
        else:
            print("[GroqLLMService] No valid GROQ_API_KEY found in environment. Intelligent fallback active.")
            self.client = None

    def is_cloud_enabled(self) -> bool:
        return self.client is not None

    # --- 1. Intent Routing ---
    def classify_intent(self, text: str) -> Dict[str, Any]:
        """
        Classifies spoken operator text into:
        - daily_tasks
        - machine_status
        - log_incident
        - manual_question
        - small_talk
        """
        cleaned = (text or "").strip()
        if not cleaned:
            return {
                "intent": "small_talk",
                "reply_text": "I'm listening. How can I help you in the cab today?",
                "confidence": 1.0,
                "data": {}
            }

        if self.client:
            try:
                prompt = (
                    "You are CatMate, an in-cab voice assistant for CAT machine operators.\n"
                    "Classify the following operator speech into one of these intents:\n"
                    "- daily_tasks: Asking about scheduled tasks, agenda, what's on plate, pace, next job.\n"
                    "- machine_status: Inquiring about fuel, seatbelt, engine hours, temps, equipment health.\n"
                    "- log_incident: Reporting a mechanical failure, leak, damage, accident, hazard, safety problem.\n"
                    "- manual_question: Asking how to operate, troubleshoot, check fluids, specs from the manual.\n"
                    "- small_talk: General greetings, thanks, jokes, or chit-chat.\n\n"
                    "Respond with a JSON object in this exact format:\n"
                    '{"intent": "...", "confidence": 0.95, "reply_text": "Spoken-friendly concise reply under 30 words"}\n\n'
                    f'Operator Speech: "{cleaned}"'
                )

                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"},
                    temperature=0.1,
                    max_tokens=150,
                )
                raw_json = response.choices[0].message.content
                parsed = json.loads(raw_json)
                return {
                    "intent": parsed.get("intent", "small_talk"),
                    "reply_text": parsed.get("reply_text", "Got it."),
                    "confidence": float(parsed.get("confidence", 0.9)),
                    "data": {}
                }
            except Exception as e:
                print(f"[GroqLLMService] Intent classification error: {e}. Using fallback.")

        # Fallback Rule-based Classifier
        return self._fallback_classify_intent(cleaned)

    def _fallback_classify_intent(self, text: str) -> Dict[str, Any]:
        lower = text.lower()

        # daily_tasks
        if any(w in lower for w in ["plate", "task", "tasks", "schedule", "agenda", "today", "what's next", "plan"]):
            return {
                "intent": "daily_tasks",
                "reply_text": "You've got your assigned tasks queued up for today. Let's keep a steady pace.",
                "confidence": 0.92,
                "data": {}
            }

        # machine_status
        if any(w in lower for w in ["status", "fuel", "seatbelt", "hours", "engine", "temp", "coolant", "battery", "reading"]):
            return {
                "intent": "machine_status",
                "reply_text": "Telemetries look active. Your fuel is steady and engine hours are logged.",
                "confidence": 0.90,
                "data": {}
            }

        # log_incident
        if any(w in lower for w in ["incident", "leak", "broken", "crack", "fire", "smoke", "accident", "damage", "hazard", "spill", "log"]):
            return {
                "intent": "log_incident",
                "reply_text": "Logging safety incident now. Capturing details for site records.",
                "confidence": 0.95,
                "data": {}
            }

        # manual_question
        if any(w in lower for w in ["how to", "how do i", "manual", "procedure", "where is", "check", "gauge", "spec", "level"]):
            return {
                "intent": "manual_question",
                "reply_text": "Consulting official CAT operator manual for step-by-step procedures.",
                "confidence": 0.88,
                "data": {}
            }

        # Default small talk
        return {
            "intent": "small_talk",
            "reply_text": "CatMate ready. Ask me what's on your plate, check machine status, or ask about equipment manuals.",
            "confidence": 0.80,
            "data": {}
        }

    # --- 2. Incident Structuring ---
    def structure_incident(self, raw_text: str) -> Dict[str, Any]:
        """
        Parses spoken incident report into structured fields:
        {
            "type": str,
            "location": str,
            "severity": "Low" | "Medium" | "High" | "Critical",
            "description": str
        }
        """
        cleaned = (raw_text or "").strip()
        if not cleaned:
            return {
                "type": "General Observation",
                "location": "Job Site",
                "severity": "Low",
                "description": "No audible incident recorded."
            }

        if self.client:
            try:
                prompt = (
                    "You are a heavy machinery safety supervisor.\n"
                    "Extract structured fields from this operator's spoken hazard or incident report.\n"
                    "Respond with a valid JSON object matching this schema:\n"
                    '{\n  "type": "Hydraulic Leak | Structural Crack | Engine Fault | Proximity Hazard | Seatbelt Non-Compliance | Weather Hazard | Other",\n'
                    '  "location": "Near Bucket | Engine Bay | Cab | Left Track | Right Track | Trench 3 | Boom | Hydraulic Tank | Other",\n'
                    '  "severity": "Low | Medium | High | Critical",\n'
                    '  "description": "Clean summary of incident under 20 words"\n}\n\n'
                    f'Operator Report: "{cleaned}"'
                )

                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"},
                    temperature=0.0,
                    max_tokens=150,
                )
                raw_json = response.choices[0].message.content
                return json.loads(raw_json)
            except Exception as e:
                print(f"[GroqLLMService] Incident structuring error: {e}. Using fallback.")

        return self._fallback_structure_incident(cleaned)

    def _fallback_structure_incident(self, text: str) -> Dict[str, Any]:
        lower = text.lower()

        # Type detection
        if "leak" in lower or "fluid" in lower or "oil" in lower:
            inc_type = "Hydraulic Leak"
        elif "crack" in lower or "weld" in lower or "arm" in lower:
            inc_type = "Structural Crack"
        elif "overheat" in lower or "smoke" in lower or "engine" in lower:
            inc_type = "Engine Fault"
        elif "brake" in lower or "stopping" in lower:
            inc_type = "Braking Hazard"
        elif "track" in lower or "undercarriage" in lower:
            inc_type = "Track Issue"
        else:
            inc_type = "Mechanical Issue"

        # Location detection
        if "bucket" in lower:
            location = "Near Bucket"
        elif "boom" in lower or "stick" in lower:
            location = "Boom Assembly"
        elif "engine" in lower or "bay" in lower or "hood" in lower:
            location = "Engine Bay"
        elif "track" in lower or "chain" in lower or "sprocket" in lower:
            location = "Undercarriage"
        elif "tank" in lower:
            location = "Hydraulic Tank"
        elif "cab" in lower:
            location = "Operator Cab"
        else:
            location = "Machine Work Zone"

        # Severity detection
        if any(w in lower for w in ["fire", "burst", "critical", "severe", "fatal", "emergency"]):
            severity = "Critical"
        elif any(w in lower for w in ["heavy", "fast", "huge", "dangerous", "uncontrolled", "high"]):
            severity = "High"
        elif any(w in lower for w in ["minor", "slow", "small", "slight", "low"]):
            severity = "Low"
        else:
            severity = "Medium"

        return {
            "type": inc_type,
            "location": location,
            "severity": severity,
            "description": text[:100]
        }

    # --- 3. Training Suggestion Copy ---
    def generate_training_copy(
        self,
        operator_name: str,
        flag: Dict[str, Any],
        module: Dict[str, Any]
    ) -> str:
        """
        Creates a friendly, proactive coaching prompt for the in-cab display / voice.
        """
        flag_type = flag.get("flag_type", "Operational Note")
        details = flag.get("details", "")
        module_title = module.get("title", "Safety Refresher")
        duration_sec = module.get("duration_sec", 90)

        if self.client:
            try:
                prompt = (
                    f"Operator name: {operator_name}\n"
                    f"Behavior detected: {flag_type} ({details})\n"
                    f"Recommended module: {module_title} ({duration_sec} seconds)\n\n"
                    "Write a 1-sentence supportive, respectful coaching nudge for the operator's in-cab voice assistant. Keep it under 25 words."
                )

                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                    max_tokens=60,
                )
                return response.choices[0].message.content.strip().strip('"')
            except Exception as e:
                print(f"[GroqLLMService] Training copy error: {e}. Using fallback.")

        return f"{operator_name}, noticed {flag_type.lower()} during your shift. When you take a breather, check the {duration_sec}s '{module_title}' clip."

    # --- 4. Manual RAG Answer Generation ---
    def answer_manual_question(
        self,
        question: str,
        context_chunks: List[Dict[str, Any]],
        machine_model: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Answers operator technical question grounded strictly in retrieved CAT manual chunks.
        Returns:
            {
                "answer": str,
                "source_manual": str
            }
        """
        if not context_chunks:
            return {
                "answer": "I couldn't find specific instructions in the loaded machine manuals. Please consult site maintenance.",
                "source_manual": "CAT Operator Library"
            }

        top_citation = context_chunks[0].get("citation", "CAT Official Manual")

        if self.client:
            try:
                context_str = "\n\n".join(
                    f"Source: {c['citation']}\nContent: {c['chunk_text']}"
                    for c in context_chunks
                )

                prompt = (
                    "You are CatMate, an expert Caterpillar machinery technician assistant.\n"
                    "Answer the operator's question using ONLY the provided official manual excerpts.\n"
                    "Provide clear, numbered steps if explaining a procedure. Keep it spoken-friendly and concise.\n"
                    "Always mention the source manual and page in your response.\n\n"
                    f"Manual Excerpts:\n{context_str}\n\n"
                    f"Operator Question: {question}\n\n"
                    "Format response as JSON:\n"
                    '{"answer": "...", "source_manual": "Exact manual title and page"}'
                )

                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"},
                    temperature=0.1,
                    max_tokens=300,
                )
                raw_json = response.choices[0].message.content
                parsed = json.loads(raw_json)
                return {
                    "answer": parsed.get("answer", context_chunks[0]["chunk_text"]),
                    "source_manual": parsed.get("source_manual", top_citation)
                }
            except Exception as e:
                print(f"[GroqLLMService] RAG answer error: {e}. Using fallback.")

        # Fallback RAG synthesis: extract direct instructive passage
        best_chunk = context_chunks[0]
        chunk_text = best_chunk.get("chunk_text", "")
        # Extract first 2-3 sentences for clean spoken delivery
        sentences = re.split(r"(?<=[.!?])\s+", chunk_text)
        summary = " ".join(sentences[:3]) if sentences else chunk_text[:200]

        return {
            "answer": summary,
            "source_manual": best_chunk.get("citation", top_citation)
        }


# Global accessor
llm_service = GroqLLMService()
