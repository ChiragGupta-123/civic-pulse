"""Pydantic v2 schemas for the Bureaucracy Agent domain."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class AgentRunCreateRequest(BaseModel):
    """Payload to initiate an autonomous bureaucracy execution run."""

    service_code: Literal["SCHOLARSHIP_RENEWAL", "MSME_LICENSE", "WELFARE_SUBSIDY"] = "SCHOLARSHIP_RENEWAL"
    portal_url: str | None = None
    auto_solve_hitl_otp: str | None = None


class HitlSupplyInputRequest(BaseModel):
    """Payload supplied by a human citizen resolving an obstacle (e.g. SMS OTP)."""

    obstacle_type: Literal["OTP", "CAPTCHA"] = "OTP"
    user_input: str


class AgentActionStepDto(BaseModel):
    """A discrete recorded step taken by the browser automation agent."""

    model_config = ConfigDict(from_attributes=True)

    step_number: int
    action: str
    detail: str
    screenshot_url: str | None = None
    status: str
    timestamp: datetime


class AgentRunDetailDto(BaseModel):
    """Comprehensive details and audit timeline of a service execution run."""

    model_config = ConfigDict(from_attributes=True)

    run_id: uuid.UUID
    service_code: str
    portal_url: str
    status: str
    obstacle_type: str | None = None
    prompt_message: str | None = None
    obstacle_screenshot_url: str | None = None
    tracking_receipt_id: str | None = None
    receipt_pdf_url: str | None = None
    error_detail: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime
    steps: list[AgentActionStepDto] = Field(default_factory=list)

