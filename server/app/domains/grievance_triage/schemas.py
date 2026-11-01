"""Pydantic v2 schemas for the Grievance Triage domain."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RoutedDepartmentInfoDto(BaseModel):
    """Department info attached to a routed grievance ticket."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    code: str
    name: str
    contact_email: str
    sla_hours_critical: int
    sla_hours_high: int
    sla_hours_medium: int
    sla_hours_low: int


class TimelineEventDto(BaseModel):
    """Auditable status change event on a grievance."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    ticket_id: uuid.UUID
    status: str
    remarks: str
    actor_id: uuid.UUID | None = None
    proof_url: str | None = None
    timestamp: datetime


class GrievanceTicketDto(BaseModel):
    """Full details of a grievance ticket."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    ticket_number: str
    reporter_id: uuid.UUID | None = None
    category: str
    description: str
    voice_transcript: str | None = None
    media_urls: list[str] = Field(default_factory=list)
    latitude: float
    longitude: float
    address_label: str | None = None
    severity: str
    severity_score: int
    ai_triage_summary: str
    routed_department_id: uuid.UUID
    routed_department: RoutedDepartmentInfoDto | None = None
    duplicate_of_id: uuid.UUID | None = None
    upvote_count: int = 1
    status: str
    sla_deadline: datetime
    resolved_at: datetime | None = None
    resolution_proof_urls: list[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    timeline: list[TimelineEventDto] = Field(default_factory=list)


class DepartmentScorecardDto(BaseModel):
    """Department-level SLA compliance scorecard."""

    model_config = ConfigDict(from_attributes=True)

    department_id: uuid.UUID
    department_code: str
    department_name: str
    total_assigned: int
    resolved_count: int
    sla_breached_count: int
    sla_compliance_pct: float


class DashboardKpiDto(BaseModel):
    """High-level KPIs for civic grievance resolution."""

    total_tickets: int
    resolved_tickets: int
    active_tickets: int
    compliance_rate_pct: float
    average_resolution_hours: float


class GrievanceMapMarkerDto(BaseModel):
    """Geospatial pin for public accountability map."""

    ticket_id: uuid.UUID
    ticket_number: str
    category: str
    severity: str
    status: str
    latitude: float
    longitude: float
    address_label: str | None = None
    upvote_count: int = 1
    created_at: datetime


class PublicDashboardDto(BaseModel):
    """Composite payload for the public grievance dashboard."""

    kpi: DashboardKpiDto
    department_scorecards: list[DepartmentScorecardDto]
    markers: list[GrievanceMapMarkerDto]


class GrievanceStatusUpdateRequest(BaseModel):
    """Payload to transition ticket status by an authorized officer."""

    status: str
    remarks: str
