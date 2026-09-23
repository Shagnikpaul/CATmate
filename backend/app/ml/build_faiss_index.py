"""
Script to extract text from CAT manual PDFs, generate dense embeddings,
and build a high-performance FAISS vector index (Section 6e).
"""

import json
import re
import sys
from pathlib import Path
from typing import Dict, List, Optional
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

# Optional fitz (PyMuPDF) or pypdf
try:
    import fitz  # PyMuPDF
    PDF_BACKEND = "pymupdf"
except ImportError:
    import pypdf
    PDF_BACKEND = "pypdf"

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent  # backend/
MANUALS_DIR = BASE_DIR / "data" / "manuals"
OUTPUT_DIR = Path(__file__).resolve().parent  # backend/app/ml/
INDEX_PATH = OUTPUT_DIR / "faiss_index.bin"
METADATA_PATH = OUTPUT_DIR / "chunks_metadata.json"

MANUAL_TITLES = {
    "CAT-320D.pdf": "CAT 320D Hydraulic Excavator Operation & Maintenance Manual",
    "CAT-322.pdf": "CAT 322 Excavator Specifications & Operation Manual",
}


def extract_pages_from_pdf(pdf_path: Path) -> List[Dict[str, any]]:
    """Extract page text from PDF using PyMuPDF or pypdf."""
    pages_data = []
    if PDF_BACKEND == "pymupdf":
        doc = fitz.open(str(pdf_path))
        for page_idx in range(len(doc)):
            text = doc[page_idx].get_text()
            if text and len(text.strip()) > 30:
                pages_data.append({
                    "page_number": page_idx + 1,
                    "text": text.strip()
                })
        doc.close()
    else:
        reader = pypdf.PdfReader(str(pdf_path))
        for page_idx, page in enumerate(reader.pages):
            text = page.extract_text()
            if text and len(text.strip()) > 30:
                pages_data.append({
                    "page_number": page_idx + 1,
                    "text": text.strip()
                })
    return pages_data


def chunk_text(
    text: str,
    target_size: int = 500,
    overlap: int = 80
) -> List[str]:
    """
    Split text into semantically coherent passages respecting sentence/paragraph boundaries.
    """
    # Clean excessive whitespace and unwanted non-printable characters
    cleaned = re.sub(r"[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f-\x9f]", " ", text)
    cleaned = re.sub(r"[ \t]+", " ", cleaned)
    cleaned = re.sub(r"\n\s*\n+", "\n\n", cleaned)

    paragraphs = cleaned.split("\n\n")
    chunks: List[str] = []
    current_chunk = ""

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue

        if len(current_chunk) + len(para) <= target_size:
            current_chunk = f"{current_chunk}\n\n{para}".strip()
        else:
            if current_chunk:
                chunks.append(current_chunk)
                # Overlap tail
                tail = current_chunk[-overlap:] if len(current_chunk) > overlap else current_chunk
                current_chunk = f"{tail} {para}".strip()
            else:
                # Large paragraph: split by sentences
                sentences = re.split(r"(?<=[.!?])\s+", para)
                temp = ""
                for s in sentences:
                    if len(temp) + len(s) <= target_size:
                        temp = f"{temp} {s}".strip()
                    else:
                        if temp:
                            chunks.append(temp)
                        temp = s
                if temp:
                    current_chunk = temp

    if current_chunk:
        chunks.append(current_chunk)

    return chunks


def build_index(
    model_name: str = "all-MiniLM-L6-v2",
    max_pages_per_manual: Optional[int] = None
):
    """
    Extracts manuals, embeds chunks, and builds FAISS index.
    """
    pdf_files = list(MANUALS_DIR.glob("*.pdf"))
    if not pdf_files:
        raise FileNotFoundError(f"No PDF manuals found in {MANUALS_DIR}")

    print(f"Found {len(pdf_files)} manual PDF(s) in {MANUALS_DIR}:")
    for f in pdf_files:
        print(f" - {f.name} ({f.stat().st_size / (1024*1024):.2f} MB)")

    all_chunks_metadata: List[Dict] = []
    chunk_counter = 0

    for pdf_path in pdf_files:
        manual_id = pdf_path.stem
        manual_title = MANUAL_TITLES.get(pdf_path.name, f"{manual_id} Manual")
        print(f"\nProcessing {pdf_path.name} ({manual_title})...")

        pages = extract_pages_from_pdf(pdf_path)
        if max_pages_per_manual and len(pages) > max_pages_per_manual:
            pages = pages[:max_pages_per_manual]

        print(f"Extracted {len(pages)} valid text pages.")

        for p in pages:
            page_num = p["page_number"]
            page_chunks = chunk_text(p["text"])
            for c_text in page_chunks:
                if len(c_text.strip()) < 40:
                    continue
                all_chunks_metadata.append({
                    "chunk_id": chunk_counter,
                    "manual_id": manual_id,
                    "manual_title": manual_title,
                    "page_number": page_num,
                    "chunk_text": c_text.strip()
                })
                chunk_counter += 1

    print(f"\nTotal chunks generated: {len(all_chunks_metadata)}")
    if not all_chunks_metadata:
        print("Warning: No chunks generated.")
        return

    # Generate Embeddings
    print(f"\nLoading embedding model '{model_name}'...")
    encoder = SentenceTransformer(model_name)

    texts_to_embed = [c["chunk_text"] for c in all_chunks_metadata]
    print(f"Encoding {len(texts_to_embed)} chunks into dense vectors...")
    embeddings = encoder.encode(
        texts_to_embed,
        batch_size=32,
        show_progress_bar=True,
        normalize_embeddings=True,  # Normalized so Inner Product = Cosine Similarity
        convert_to_numpy=True
    ).astype(np.float32)

    dimension = embeddings.shape[1]
    print(f"Embeddings shape: {embeddings.shape} (Dimension: {dimension})")

    # Build FAISS IndexFlatIP (Cosine similarity)
    print("Building FAISS IndexFlatIP...")
    index = faiss.IndexFlatIP(dimension)
    index.add(embeddings)
    print(f"FAISS index built with {index.ntotal} vectors.")

    # Save to disk
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    faiss.write_index(index, str(INDEX_PATH))
    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(all_chunks_metadata, f, indent=2, ensure_ascii=False)

    print(f"\n[OK] FAISS index saved to {INDEX_PATH}")
    print(f"[OK] Chunks metadata saved to {METADATA_PATH}")


if __name__ == "__main__":
    build_index()
