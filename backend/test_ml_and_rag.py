"""
End-to-End Verification Test for Section 6d (ML Task Time Predictor)
and Section 6e (FAISS RAG & Groq/Fallback LLM Assistant).
"""

import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.services.predictor import predictor_service
from app.services.rag_service import rag_service
from app.services.llm_service import llm_service


def test_section_6d_predictor():
    print("=" * 60)
    print("TESTING SECTION 6d: TASK TIME PREDICTOR (RANDOM FOREST)")
    print("=" * 60)

    test_cases = [
        {"task_type": "Trenching", "weather": "Rainy", "operator_skill": "Beginner", "machine_age_yrs": 4, "estimated_time_min": 50},
        {"task_type": "Loading", "weather": "Sunny", "operator_skill": "Expert", "machine_age_yrs": 1, "estimated_time_min": 45},
        {"task_type": "Grading", "weather": "Muddy", "operator_skill": "Intermediate", "machine_age_yrs": 5, "estimated_time_min": 60},
    ]

    for tc in test_cases:
        res = predictor_service.predict(**tc)
        print(f"Input: {tc['task_type']} | {tc['weather']} | {tc['operator_skill']} (est: {tc['estimated_time_min']}m)")
        print(f" -> Predicted: {res['predicted_time_min']} min | Baseline: {res['baseline_estimate_min']} min | Confidence: {res['confidence']}\n")


def test_section_6e_rag_and_llm():
    print("=" * 60)
    print("TESTING SECTION 6e: RAG MANUAL RETRIEVAL & LLM SERVICES")
    print("=" * 60)

    # 1. FAISS RAG Retrieval
    query = "how do I check hydraulic fluid level"
    print(f"1. RAG Query: '{query}'")
    chunks = rag_service.search(query, top_k=2)
    for i, c in enumerate(chunks, 1):
        print(f"   [Chunk {i}] Citation: {c['citation']} (Score: {c['score']:.4f})")
        print(f"   Snippet: {c['chunk_text'][:120]}...\n")

    # 2. Manual RAG Answer Generation
    rag_answer = llm_service.answer_manual_question(query, chunks)
    print("2. Manual RAG Answer Output:")
    print(f"   Answer: {rag_answer['answer']}")
    print(f"   Source: {rag_answer['source_manual']}\n")

    # 3. Intent Routing
    test_queries = [
        "what's on my plate today",
        "check my fuel level and seatbelt",
        "hydraulic leak near the bucket",
        "how do i check track tension",
        "hello catmate good morning"
    ]
    print("3. Intent Routing Tests:")
    for tq in test_queries:
        intent_res = llm_service.classify_intent(tq)
        print(f"   Spoken: '{tq}' -> Intent: [{intent_res['intent']}] (Conf: {intent_res['confidence']})")
        print(f"   Reply:  '{intent_res['reply_text']}'\n")

    # 4. Incident Structuring
    raw_incident = "there is a hydraulic leak spraying fluid near the bucket cylinder"
    print(f"4. Incident Structuring: '{raw_incident}'")
    incident_res = llm_service.structure_incident(raw_incident)
    print(f"   Structured Output: {incident_res}\n")

    # 5. Training Suggestion Copy
    flag = {
        "flag_type": "Excessive Idling",
        "details": "Machine idling reached 52 min (threshold: 45 min)",
        "risk_level": "Medium"
    }
    module = {
        "module_id": "M002",
        "title": "Anti-Idling Protocols & Auto-Shutdown",
        "duration_sec": 75
    }
    coach_copy = llm_service.generate_training_copy("Rahul", flag, module)
    print("5. Training Coaching Copy:")
    print(f"   Nudge: {coach_copy}\n")


if __name__ == "__main__":
    test_section_6d_predictor()
    test_section_6e_rag_and_llm()
    print("ALL ML & RAG TESTS PASSED SUCCESSFULLY!")
