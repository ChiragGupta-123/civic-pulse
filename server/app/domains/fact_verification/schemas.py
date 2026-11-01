"""Pydantic v2 schemas for the Fact-Verification & Deepfake Audit domain."""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class EvidenceCitationDto(BaseModel):
    """Evidence citation linking verified authority source to claim."""

    source_title: str
    authority: str
    source_url: str
    claim_rebuttal_or_fact: str
    similarity_score: float
    verified_at: str | None = None


class ProvenanceNodeDto(BaseModel):
    """Step in the verification audit trail."""

    node_id: str
    step_name: str
    detail: str
    timestamp: datetime


class ForensicAuditResultDto(BaseModel):
    """Synthesized verdict, credibility scores, and forensic markers."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    claim_id: uuid.UUID
    verdict: str  # VERIFIED_TRUE, FALSE_CLAIM, SYNTHETIC_OR_MANIPULATED, MISLEADING, UNVERIFIED
    confidence_score: int
    credibility_rating: int
    c2pa_status: str  # MANIFEST_VALID, MANIFEST_TAMPERED, MANIFEST_MISSING
    c2pa_issuer: str | None = None
    is_deepfake_suspected: bool
    synthetic_probability: float
    ela_heatmap_url: str | None = None
    technical_findings: list[str] = Field(default_factory=list)
    evidence_citations: list[EvidenceCitationDto] = Field(default_factory=list)
    provenance_nodes: list[ProvenanceNodeDto] = Field(default_factory=list)
    explanation_summary: str
    created_at: datetime


class ClaimAuditDetailDto(BaseModel):
    """Composite submission details and associated audit findings."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    claim_text: str
    source_url: str | None = None
    media_type: str
    media_url: str | None = None
    media_sha256: str | None = None
    media_phash: str | None = None
    status: str
    created_at: datetime
    audit_result: ForensicAuditResultDto | None = None


class ClaimAuditRequest(BaseModel):
    """JSON payload for text-only claim audit."""

    claim_text: str
    source_url: str | None = None


class TrustedFactRecordCreateRequest(BaseModel):
    """Payload to register an official civic truth in the registry."""

    reference_code: str
    canonical_fact: str
    authority_name: str
    source_url: str
    knowledge_triples: list[dict[str, Any]] = Field(default_factory=list)
    effective_date: date | None = None


class TrustedFactRecordDto(BaseModel):
    """Registered official truth record."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    reference_code: str
    canonical_fact: str
    authority_name: str
    source_url: str
    knowledge_triples: list[dict[str, Any]] = Field(default_factory=list)
    effective_date: date | None = None
    created_at: datetime

