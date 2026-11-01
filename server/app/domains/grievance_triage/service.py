"""Service layer for the Grievance Triage domain."""

from __future__ import annotations

import logging
import uuid
from collections.abc import Sequence
from datetime import UTC, datetime, timedelta

from geoalchemy2.elements import WKTElement
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException, ValidationException
from app.core.pagination import PaginatedMeta, PaginationParams
from app.core.storage import storage_service
from app.domains.grievance_triage.models import GrievanceTicket, GrievanceTimelineEvent
from app.domains.grievance_triage.multimodal_triage import (
    analyze_grievance_hazard,
    transcribe_grievance_audio,
)
from app.domains.grievance_triage.schemas import (
    DashboardKpiDto,
    DepartmentScorecardDto,
    GrievanceMapMarkerDto,
    GrievanceTicketDto,
    PublicDashboardDto,
    RoutedDepartmentInfoDto,
    TimelineEventDto,
)
from app.domains.grievance_triage.spatial_dedup import find_nearby_duplicate_ticket
from app.domains.identity.models import Department

logger = logging.getLogger(__name__)


def _ticket_to_dto(
    ticket: GrievanceTicket,
    dept: Department | None = None,
    timeline: Sequence[GrievanceTimelineEvent] = (),
) -> GrievanceTicketDto:
    """Explicitly map ORM GrievanceTicket to GrievanceTicketDto."""
    return GrievanceTicketDto(
        id=ticket.id,
        ticket_number=ticket.ticket_number,
        reporter_id=ticket.reporter_id,
        category=ticket.category,
        description=ticket.description,
        voice_transcript=ticket.voice_transcript,
        media_urls=ticket.media_urls or [],
        latitude=ticket.latitude,
        longitude=ticket.longitude,
        address_label=ticket.address_label,
        severity=ticket.severity,
        severity_score=ticket.severity_score,
        ai_triage_summary=ticket.ai_triage_summary,
        routed_department_id=ticket.routed_department_id,
        routed_department=RoutedDepartmentInfoDto.model_validate(dept) if dept else None,
        duplicate_of_id=ticket.duplicate_of_id,
        upvote_count=ticket.upvote_count,
        status=ticket.status,
        sla_deadline=ticket.sla_deadline,
        resolved_at=ticket.resolved_at,
        resolution_proof_urls=ticket.resolution_proof_urls or [],
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
        timeline=[TimelineEventDto.model_validate(ev) for ev in timeline],
    )


class GrievanceTriageService:
    """Coordinates intake, PostGIS 50m deduplication, SLA assignment, and status updates."""

    async def create_ticket(
        self,
        db: AsyncSession,
        *,
        description: str,
        latitude: float,
        longitude: float,
        address_label: str | None = None,
        category_hint: str | None = None,
        photo_bytes: bytes | None = None,
        photo_filename: str | None = None,
        photo_content_type: str | None = None,
        audio_bytes: bytes | None = None,
        audio_filename: str | None = None,
        audio_content_type: str | None = None,
        reporter_id: uuid.UUID | None = None,
    ) -> GrievanceTicketDto:
        """Process multimodal grievance report, perform spatial dedup, and assign SLA."""
        # Validate coordinates
        if not (-90.0 <= latitude <= 90.0 and -180.0 <= longitude <= 180.0):
            raise ValidationException("Latitude must be between -90 and 90, longitude between -180 and 180.")

        media_urls: list[str] = []

        # Upload photo if provided
        if photo_bytes:
            filename = photo_filename or f"photo_{uuid.uuid4().hex[:8]}.jpg"
            photo_url = await storage_service.upload_bytes(
                data=photo_bytes,
                folder="grievances",
                filename=filename,
                content_type=photo_content_type or "image/jpeg",
            )
            media_urls.append(photo_url)

        # Upload audio if provided
        if audio_bytes:
            filename = audio_filename or f"audio_{uuid.uuid4().hex[:8]}.wav"
            audio_url = await storage_service.upload_bytes(
                data=audio_bytes,
                folder="grievances/audio",
                filename=filename,
                content_type=audio_content_type or "audio/wav",
            )
            media_urls.append(audio_url)

        # Transcribe audio
        voice_transcript = await transcribe_grievance_audio(audio_bytes)

        # AI hazard triage
        triage = analyze_grievance_hazard(
            description=description,
            voice_transcript=voice_transcript,
            image_bytes=photo_bytes,
            category_hint=category_hint,
        )

        # Match department
        dept_stmt = select(Department).where(Department.code == triage["department_code"])
        dept_res = await db.execute(dept_stmt)
        department = dept_res.scalar_one_or_none()
        if not department:
            first_dept = await db.execute(select(Department).limit(1))
            department = first_dept.scalar_one()

        # Check for 50m spatial duplicate
        duplicate_of_id: uuid.UUID | None = None
        nearby_ticket = await find_nearby_duplicate_ticket(
            db=db,
            latitude=latitude,
            longitude=longitude,
            category=triage["category"],
            radius_meters=50.0,
        )
        if nearby_ticket:
            nearby_ticket.upvote_count += 1
            duplicate_of_id = nearby_ticket.id

        # Calculate SLA deadline
        sla_hours = triage.get("sla_hours", 24)
        now = datetime.now(UTC)
        sla_deadline = now + timedelta(hours=sla_hours)

        ticket_number = f"TICK-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        geom = WKTElement(f"POINT({longitude} {latitude})", srid=4326)

        ticket = GrievanceTicket(
            id=uuid.uuid4(),
            ticket_number=ticket_number,
            reporter_id=reporter_id,
            category=triage["category"],
            description=description,
            voice_transcript=voice_transcript,
            media_urls=media_urls,
            geom=geom,
            latitude=latitude,
            longitude=longitude,
            address_label=address_label,
            severity=triage["severity"],
            severity_score=triage["severity_score"],
            ai_triage_summary=triage["ai_triage_summary"],
            routed_department_id=department.id,
            duplicate_of_id=duplicate_of_id,
            upvote_count=1,
            status="TRIAGED",
            sla_deadline=sla_deadline,
            resolved_at=None,
            resolution_proof_urls=[],
        )
        db.add(ticket)
        await db.flush()

        # Initial timeline event
        remarks = (
            f"Ticket triaged as {triage['severity']} severity; routed to {department.name} "
            f"with SLA deadline {sla_deadline.strftime('%Y-%m-%d %H:%M:%S UTC')}."
        )
        if nearby_ticket:
            remarks += f" Linked as duplicate of ticket #{nearby_ticket.ticket_number} (upvote count: {nearby_ticket.upvote_count})."

        timeline_event = GrievanceTimelineEvent(
            id=uuid.uuid4(),
            ticket_id=ticket.id,
            status="TRIAGED",
            remarks=remarks,
            actor_id=reporter_id,
            proof_url=media_urls[0] if media_urls else None,
            timestamp=now,
        )
        db.add(timeline_event)
        await db.commit()
        await db.refresh(ticket)

        return _ticket_to_dto(ticket, department, [timeline_event])

    async def get_ticket(self, db: AsyncSession, ticket_id: uuid.UUID) -> GrievanceTicketDto:
        """Fetch ticket by ID with department info and chronological timeline."""
        stmt = select(GrievanceTicket).where(GrievanceTicket.id == ticket_id)
        res = await db.execute(stmt)
        ticket = res.scalar_one_or_none()
        if not ticket:
            raise NotFoundException("Grievance ticket not found.")

        dept_res = await db.execute(
            select(Department).where(Department.id == ticket.routed_department_id)
        )
        department = dept_res.scalar_one_or_none()

        tl_res = await db.execute(
            select(GrievanceTimelineEvent)
            .where(GrievanceTimelineEvent.ticket_id == ticket_id)
            .order_by(GrievanceTimelineEvent.timestamp.asc())
        )
        timeline = tl_res.scalars().all()

        return _ticket_to_dto(ticket, department, timeline)

    async def list_tickets(
        self,
        db: AsyncSession,
        *,
        category: str | None = None,
        severity: str | None = None,
        status: str | None = None,
        params: PaginationParams,
    ) -> tuple[list[GrievanceTicketDto], PaginatedMeta]:
        """Paginated list of grievance tickets matching filters."""
        query = select(GrievanceTicket)
        count_query = select(func.count(GrievanceTicket.id))

        if category:
            query = query.where(GrievanceTicket.category == category)
            count_query = count_query.where(GrievanceTicket.category == category)
        if severity:
            query = query.where(GrievanceTicket.severity == severity)
            count_query = count_query.where(GrievanceTicket.severity == severity)
        if status:
            query = query.where(GrievanceTicket.status == status)
            count_query = count_query.where(GrievanceTicket.status == status)

        total_res = await db.execute(count_query)
        total_items = total_res.scalar() or 0

        query = query.order_by(GrievanceTicket.created_at.desc()).offset(params.offset).limit(params.limit)
        items_res = await db.execute(query)
        tickets = items_res.scalars().all()

        # Prefetch departments
        dept_ids = {t.routed_department_id for t in tickets}
        dept_map = {}
        if dept_ids:
            depts_res = await db.execute(select(Department).where(Department.id.in_(dept_ids)))
            for d in depts_res.scalars().all():
                dept_map[d.id] = d

        dtos = [_ticket_to_dto(t, dept_map.get(t.routed_department_id), []) for t in tickets]
        meta = PaginatedMeta.build(page=params.page, page_size=params.page_size, total_items=total_items)
        return dtos, meta

    async def update_ticket_status(
        self,
        db: AsyncSession,
        *,
        ticket_id: uuid.UUID,
        new_status: str,
        remarks: str,
        actor_id: uuid.UUID | None = None,
        resolution_proof_url: str | None = None,
    ) -> GrievanceTicketDto:
        """Update ticket status, record resolution timestamp if resolved, and append timeline event."""
        stmt = select(GrievanceTicket).where(GrievanceTicket.id == ticket_id)
        res = await db.execute(stmt)
        ticket = res.scalar_one_or_none()
        if not ticket:
            raise NotFoundException("Grievance ticket not found.")

        now = datetime.now(UTC)
        ticket.status = new_status
        if new_status == "RESOLVED":
            ticket.resolved_at = now
            if resolution_proof_url:
                ticket.resolution_proof_urls = [*ticket.resolution_proof_urls, resolution_proof_url]

        timeline_event = GrievanceTimelineEvent(
            id=uuid.uuid4(),
            ticket_id=ticket.id,
            status=new_status,
            remarks=remarks,
            actor_id=actor_id,
            proof_url=resolution_proof_url,
            timestamp=now,
        )
        db.add(timeline_event)
        await db.commit()
        await db.refresh(ticket)

        return await self.get_ticket(db, ticket_id)

    async def get_public_dashboard(self, db: AsyncSession) -> PublicDashboardDto:
        """Compute live SLA compliance metrics, department scorecards, and map markers."""
        # 1. Fetch all tickets
        stmt = select(GrievanceTicket).order_by(GrievanceTicket.created_at.desc())
        res = await db.execute(stmt)
        tickets = res.scalars().all()

        total_tickets = len(tickets)
        resolved_tickets = [t for t in tickets if t.status == "RESOLVED"]
        resolved_count = len(resolved_tickets)
        active_count = total_tickets - resolved_count

        # SLA compliance calculation
        sla_compliant_resolved = [
            t for t in resolved_tickets if t.resolved_at and t.resolved_at <= t.sla_deadline
        ]
        if resolved_count > 0:
            compliance_rate_pct = round((len(sla_compliant_resolved) / resolved_count) * 100.0, 1)
            res_times = [
                (t.resolved_at - t.created_at).total_seconds()
                for t in resolved_tickets
                if t.resolved_at and t.created_at
            ]
            total_res_time_seconds = float(sum(res_times))
            avg_res_hours = round(total_res_time_seconds / (resolved_count * 3600.0), 1)
        else:
            compliance_rate_pct = 100.0
            avg_res_hours = 0.0

        kpi = DashboardKpiDto(
            total_tickets=total_tickets,
            resolved_tickets=resolved_count,
            active_tickets=active_count,
            compliance_rate_pct=compliance_rate_pct,
            average_resolution_hours=avg_res_hours,
        )

        # 2. Scorecards by department
        depts_res = await db.execute(select(Department).order_by(Department.name.asc()))
        departments = depts_res.scalars().all()

        now = datetime.now(UTC)
        scorecards: list[DepartmentScorecardDto] = []
        for dept in departments:
            dept_tickets = [t for t in tickets if t.routed_department_id == dept.id]
            dept_total = len(dept_tickets)
            dept_resolved = [t for t in dept_tickets if t.status == "RESOLVED"]
            dept_res_count = len(dept_resolved)

            # Breached: resolved past deadline OR still open past deadline
            breached = [
                t for t in dept_tickets
                if (t.resolved_at and t.resolved_at > t.sla_deadline)
                or (t.status != "RESOLVED" and now > t.sla_deadline)
            ]
            breached_count = len(breached)

            compliance_pct = (
                round(((dept_total - breached_count) / dept_total) * 100.0, 1)
                if dept_total > 0
                else 100.0
            )

            scorecards.append(
                DepartmentScorecardDto(
                    department_id=dept.id,
                    department_code=dept.code,
                    department_name=dept.name,
                    total_assigned=dept_total,
                    resolved_count=dept_res_count,
                    sla_breached_count=breached_count,
                    sla_compliance_pct=compliance_pct,
                )
            )

        # 3. Geospatial markers
        markers = [
            GrievanceMapMarkerDto(
                ticket_id=t.id,
                ticket_number=t.ticket_number,
                category=t.category,
                severity=t.severity,
                status=t.status,
                latitude=t.latitude,
                longitude=t.longitude,
                address_label=t.address_label,
                upvote_count=t.upvote_count,
                created_at=t.created_at,
            )
            for t in tickets[:200]
        ]

        return PublicDashboardDto(
            kpi=kpi,
            department_scorecards=scorecards,
            markers=markers,
        )


grievance_service = GrievanceTriageService()
