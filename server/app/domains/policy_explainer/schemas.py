"""Pydantic schemas and DTOs for Policy Explainer."""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


class RightBenefitItemDto(BaseModel):
    """An extracted right, benefit, or financial entitlement with citation."""

    headline: str
    detail: str
    citation: str


class EligibilityRuleEvalDto(BaseModel):
    """Evaluation of an individual eligibility rule against citizen profile."""

    rule: str
    citizen_value: str
    passed: bool
    citation: str


class PolicySummaryDto(BaseModel):
    """High-level summary of an ingested government policy document."""

    id: uuid.UUID
    title: str
    reference_code: str
    doc_type: str
    issuing_body: str
    target_group: str
    status: str
    clause_count: int
    source_pdf_url: str
    published_date: date | None = None
    created_at: datetime


class PolicyExplainRequest(BaseModel):
    """Request payload to evaluate eligibility and synthesize regional audio."""

    language_code: str = Field(
        default="hi-IN",
        description="Regional language code (hi-IN, ta-IN, mr-IN, te-IN, bn-IN, en-IN)",
    )
    persona_type: Literal["CITIZEN", "SMALL_BUSINESS"] = "CITIZEN"
    custom_profile_override: dict | None = None


class PolicyExplainerDto(BaseModel):
    """Personalized plain-language summary, eligibility matrix, and audio explainer."""

    explainer_id: uuid.UUID
    policy_id: uuid.UUID
    language_code: str
    persona_type: str
    eligibility_status: Literal["ELIGIBLE", "INELIGIBLE", "PARTIAL_MATCH"]
    plain_language_summary: str
    rights_and_benefits: list[RightBenefitItemDto]
    eligibility_evaluation: list[EligibilityRuleEvalDto]
    real_world_impacts: list[str]
    audio_explainer_url: str | None = None
    audio_duration_sec: int
    created_at: datetime

