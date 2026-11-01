"""PDF/OCR document ingestion and clause chunking parser for Policy Explainer."""

from __future__ import annotations

import hashlib
import io
import math
import re
from typing import Any

import fitz  # PyMuPDF
from PIL import Image

from app.core.exceptions import ValidationException


def compute_text_embedding(text: str, dim: int = 1536) -> list[float]:
    """Generate a 1536-dimensional normalized embedding vector.

    Uses deterministic token and n-gram projection with L2 normalization to ensure
    reproducible vector distance operations even without external cloud credentials.
    """
    vec = [0.0] * dim
    clean_text = text.lower().strip()
    words = clean_text.split()
    if not words:
        words = ["empty"]

    for word in words:
        h = hashlib.sha256(word.encode("utf-8")).digest()
        for i in range(0, len(h) - 1, 2):
            idx = ((h[i] << 8) | h[i + 1]) % dim
            val = ((h[i] ^ h[i + 1]) - 128) / 128.0
            vec[idx] += val

    for n in range(2, 5):
        for i in range(len(clean_text) - n + 1):
            gram = clean_text[i : i + n]
            gh = hashlib.md5(gram.encode("utf-8")).digest()
            idx = ((gh[0] << 8) | gh[1]) % dim
            vec[idx] += (gh[2] - 128) / 256.0

    norm = math.sqrt(sum(v * v for v in vec))
    if norm > 0:
        return [v / norm for v in vec]
    vec[0] = 1.0
    return vec


_CLAUSE_REGEX = re.compile(
    r"(?:section|clause|article|rule|point|para|paragraph)\s*(\d+(?:\.\d+)*[a-z]?)",
    re.IGNORECASE,
)


def extract_clauses_from_pdf(
    pdf_bytes: bytes, chunk_size: int = 550, chunk_overlap: int = 80
) -> tuple[str, list[dict[str, Any]]]:
    """Extract full raw text and semantic clause chunks from a PDF file.

    Performs OCR fallback via pytesseract if a page contains fewer than 30 characters
    of selectable text.
    """
    if not pdf_bytes or not pdf_bytes.startswith(b"%PDF"):
        raise ValidationException(
            code="INVALID_PDF_FILE",
            message="Uploaded file is not a valid PDF document.",
        )

    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    except Exception as exc:
        raise ValidationException(
            code="INVALID_PDF_FILE",
            message="Uploaded file is not a valid PDF document.",
        ) from exc

    full_text_pages: list[tuple[int, str]] = []

    for page_idx in range(len(doc)):
        page = doc[page_idx]
        page_num = page_idx + 1
        raw_text = page.get_text("text")
        page_text = str(raw_text).strip() if raw_text else ""

        # If selectable text is insufficient, attempt OCR
        if len(page_text) < 30:
            try:
                import pytesseract

                pix = page.get_pixmap()
                img = Image.open(io.BytesIO(pix.tobytes("png")))
                ocr_text = pytesseract.image_to_string(img).strip()
                if ocr_text:
                    page_text = ocr_text
            except Exception:
                # OCR unavailable or failed; keep existing page_text
                pass

        if page_text:
            full_text_pages.append((page_num, page_text))

    doc.close()

    if not full_text_pages:
        full_text_pages = [(1, "Official notification content could not be extracted.")]

    all_raw_text = "\n\n".join(f"[Page {p}] {t}" for p, t in full_text_pages)
    clauses: list[dict[str, Any]] = []
    chunk_index = 0

    for page_num, text in full_text_pages:
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        if not paragraphs:
            paragraphs = [text]

        current_chunk = ""
        current_clause_label = f"Page {page_num}"

        for para in paragraphs:
            match = _CLAUSE_REGEX.search(para)
            if match:
                current_clause_label = f"Section {match.group(1)} (Page {page_num})"

            if len(current_chunk) + len(para) > chunk_size and current_chunk:
                clauses.append(
                    {
                        "chunk_index": chunk_index,
                        "page_number": page_num,
                        "clause_label": current_clause_label,
                        "content": current_chunk.strip(),
                    }
                )
                chunk_index += 1
                overlap_text = current_chunk[-chunk_overlap:] if len(current_chunk) > chunk_overlap else ""
                current_chunk = overlap_text + " " + para
            else:
                current_chunk = (current_chunk + " " + para).strip()

        if current_chunk:
            clauses.append(
                {
                    "chunk_index": chunk_index,
                    "page_number": page_num,
                    "clause_label": current_clause_label,
                    "content": current_chunk.strip(),
                }
            )
            chunk_index += 1

    return all_raw_text, clauses
