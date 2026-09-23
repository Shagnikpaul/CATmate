"""
FAISS Index Retrieval Service over CAT Manual Chunks (Section 6e).
Handles dense vector semantic search, filtering, and prompt context formatting.
"""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

from app.config import settings

ML_DIR = settings.ML_DIR
INDEX_PATH = ML_DIR / "faiss_index.bin"
METADATA_PATH = ML_DIR / "chunks_metadata.json"


MACHINE_TO_MANUAL = {
    "EXC001": "CAT-320D",
    "EXC002": "CAT-320D",
    "EXC003": "CAT-320D",
    "CAT-320": "CAT-320D",
    "CAT-320D": "CAT-320D",
    "CAT-322": "CAT-322",
    "EXCAVATOR": "CAT-320D",
}


class ManualRAGService:
    """
    RAG service that loads the pre-computed FAISS index and chunk metadata,
    embedding operator questions and retrieving top-k relevant manual passages.
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

        self.index: Optional[faiss.Index] = None
        self.chunks_metadata: List[Dict[str, Any]] = []
        self.encoder: Optional[SentenceTransformer] = None

        self._load_service()
        self._initialized = True

    def _load_service(self) -> None:
        try:
            if INDEX_PATH.exists() and METADATA_PATH.exists():
                print(f"[ManualRAGService] Loading FAISS index from {INDEX_PATH}...")
                self.index = faiss.read_index(str(INDEX_PATH))

                with open(METADATA_PATH, "r", encoding="utf-8") as f:
                    self.chunks_metadata = json.load(f)

                print(f"[ManualRAGService] Loaded {len(self.chunks_metadata)} chunks.")
                self.encoder = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
                print(f"[ManualRAGService] Encoder ready.")
            else:
                print(f"[ManualRAGService] FAISS index or metadata not found at {ML_DIR}. Fallback mode active.")
        except Exception as e:
            print(f"[ManualRAGService] Initialization error: {e}")
            self.index = None
            self.chunks_metadata = []

    def reload(self) -> bool:
        """Force reloads the index from disk after a build."""
        self._initialized = False
        self.__init__()
        return self.is_ready()

    def is_ready(self) -> bool:
        return self.index is not None and len(self.chunks_metadata) > 0 and self.encoder is not None

    def search(
        self,
        query: str,
        top_k: int = 3,
        manual_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Embeds query and retrieves top-k relevant manual snippets.
        """
        if not self.is_ready():
            return self._fallback_snippets(query, top_k)

        clean_query = query.strip()
        if not clean_query:
            return []

        # Resolve machine_id or model alias to manual_id
        resolved_manual = None
        if manual_id:
            m_key = manual_id.strip().upper()
            resolved_manual = MACHINE_TO_MANUAL.get(m_key, manual_id)

        # Generate normalized embedding
        query_vec = self.encoder.encode([clean_query], normalize_embeddings=True).astype(np.float32)

        # Retrieve candidates from index
        fetch_k = top_k * 6 if resolved_manual else top_k
        fetch_k = min(fetch_k, len(self.chunks_metadata))

        scores, indices = self.index.search(query_vec, fetch_k)

        results: List[Dict[str, Any]] = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0 or idx >= len(self.chunks_metadata):
                continue
            chunk = self.chunks_metadata[idx]

            # Optional filter by manual_id
            if resolved_manual and resolved_manual.upper() not in chunk.get("manual_id", "").upper():
                continue

            manual_title = chunk.get("manual_title", "CAT Operation Manual")
            page_num = chunk.get("page_number", 1)

            results.append({
                "chunk_id": chunk.get("chunk_id", int(idx)),
                "manual_id": chunk.get("manual_id"),
                "manual_title": manual_title,
                "page_number": page_num,
                "chunk_text": chunk.get("chunk_text"),
                "score": float(score),
                "citation": f"{manual_title}, p.{page_num}"
            })

            if len(results) >= top_k:
                break

        # Fallback to general search if filtered manual had no matching chunks
        if not results and resolved_manual:
            for score, idx in zip(scores[0], indices[0]):
                if idx < 0 or idx >= len(self.chunks_metadata):
                    continue
                chunk = self.chunks_metadata[idx]
                results.append({
                    "chunk_id": chunk.get("chunk_id", int(idx)),
                    "manual_id": chunk.get("manual_id"),
                    "manual_title": chunk.get("manual_title", "CAT Operation Manual"),
                    "page_number": chunk.get("page_number", 1),
                    "chunk_text": chunk.get("chunk_text"),
                    "score": float(score),
                    "citation": f"{chunk.get('manual_title', 'CAT Operation Manual')}, p.{chunk.get('page_number', 1)}"
                })
                if len(results) >= top_k:
                    break

        return results

    def format_context_for_prompt(self, chunks: List[Dict[str, Any]]) -> str:
        """
        Formats retrieved manual chunks into a clear markdown-formatted context block
        for LLM grounded generation.
        """
        if not chunks:
            return "No specific manual chunks found."

        context_blocks = []
        for i, c in enumerate(chunks, 1):
            block = (
                f"[Source {i}: {c['citation']}]\n"
                f"{c['chunk_text']}\n"
            )
            context_blocks.append(block)

        return "\n---\n".join(context_blocks)

    def _fallback_snippets(self, query: str, top_k: int) -> List[Dict[str, Any]]:
        """Fallback excerpts for common CAT operations if index is offline."""
        q_lower = query.lower()
        if "hydraulic" in q_lower or "fluid" in q_lower:
            return [{
                "chunk_id": 999,
                "manual_id": "CAT-320D",
                "manual_title": "CAT 320D Hydraulic Excavator Operation Manual",
                "page_number": 42,
                "chunk_text": "To check hydraulic system oil level: Park machine on level ground, lower bucket to ground with stick vertical. Observe sight gauge on hydraulic tank. Oil level should be between ADD and FULL marks when oil is cold.",
                "score": 0.88,
                "citation": "CAT 320D Hydraulic Excavator Operation Manual, p.42"
            }]
        elif "seatbelt" in q_lower or "safety" in q_lower:
            return [{
                "chunk_id": 998,
                "manual_id": "CAT-320D",
                "manual_title": "CAT 320D Hydraulic Excavator Operation Manual",
                "page_number": 18,
                "chunk_text": "Always fasten seat belt securely before operating equipment. Inspect seat belt webbing and buckle assembly daily for wear or damage. Replace any damaged restraint assembly immediately.",
                "score": 0.85,
                "citation": "CAT 320D Hydraulic Excavator Operation Manual, p.18"
            }]
        else:
            return [{
                "chunk_id": 997,
                "manual_id": "CAT-320D",
                "manual_title": "CAT 320D Hydraulic Excavator Operation Manual",
                "page_number": 25,
                "chunk_text": "Before operating the machine, perform a walk-around inspection. Check for fluid leaks, loose bolts, track tension, and ensure all safety guards and mirrors are clean and secured.",
                "score": 0.75,
                "citation": "CAT 320D Hydraulic Excavator Operation Manual, p.25"
            }]


rag_service = ManualRAGService()
