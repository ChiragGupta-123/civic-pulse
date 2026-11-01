"""Fact-verification domain ORM models.

Three tables store verified government registry facts, user claim submissions,
and comprehensive forensic audit results:

* ``trusted_fact_records`` — official source-of-truth facts with 1536-dim
  embeddings for pgvector semantic search.
* ``claim_submissions`` — user-submitted suspicious texts, URLs, and media assets.
* ``forensic_audit_results`` — synthesized verdicts, credibility scores, C2PA
  metadata, synthetic media/deepfake analysis, ELA heatmaps, and evidence chains.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TrustedFactRecord(Base):
    """An official verified civic fact used for semantic truth cross-examination."""

    __tablename__ = "trusted_fact_records"
    __table_args__ = (
        Index(
            "ix_trusted_fact_records_embedding_hnsw",
            "embedding",
            postgresql_using="hnsw",
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    reference_code: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False
    )
    canonical_fact: Mapped[str] = mapped_column(Text, nullable=False)
    authority_name: Mapped[str] = mapped_column(String(200), nullable=False)
    source_url: Mapped[str] = mapped_column(Text, nullable=False)
    knowledge_triples: Mapped[list[dict]] = mapped_column(
        JSONB, default=list, nullable=False
    )
    embedding: Mapped[list[float]] = mapped_column(Vector(1536), nullable=False)
    effective_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class ClaimSubmission(Base):
    """A claim or multimodal asset submitted for verification."""

    __tablename__ = "claim_submissions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    submitted_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    claim_text: Mapped[str] = mapped_column(Text, nullable=False)
    source_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    media_type: Mapped[str] = mapped_column(
        String(30), default="TEXT_ONLY", nullable=False
    )
    media_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    media_sha256: Mapped[str | None] = mapped_column(
        String(64), index=True, nullable=True
    )
    media_phash: Mapped[str | None] = mapped_column(
        String(64), index=True, nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(30), default="COMPLETED", nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    audit_result: Mapped[ForensicAuditResult | None] = relationship(
        "ForensicAuditResult",
        back_populates="claim",
        uselist=False,
        cascade="all, delete-orphan",
    )


class ForensicAuditResult(Base):
    """Detailed forensic verdict, credibility score, and evidence provenance."""

    __tablename__ = "forensic_audit_results"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    claim_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("claim_submissions.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    verdict: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    confidence_score: Mapped[int] = mapped_column(Integer, nullable=False)
    credibility_rating: Mapped[int] = mapped_column(Integer, nullable=False)
    c2pa_status: Mapped[str] = mapped_column(
        String(40), default="MANIFEST_MISSING", nullable=False
    )
    c2pa_issuer: Mapped[str | None] = mapped_column(String(200), nullable=True)
    is_deepfake_suspected: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    synthetic_probability: Mapped[float] = mapped_column(
        Float, default=0.0, nullable=False
    )
    ela_heatmap_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    technical_findings: Mapped[list[str]] = mapped_column(
        JSONB, default=list, nullable=False
    )
    evidence_citations: Mapped[list[dict]] = mapped_column(
        JSONB, default=list, nullable=False
    )
    provenance_nodes: Mapped[list[dict]] = mapped_column(
        JSONB, default=list, nullable=False
    )
    explanation_summary: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    claim: Mapped[ClaimSubmission] = relationship(
        "ClaimSubmission", back_populates="audit_result"
    )
