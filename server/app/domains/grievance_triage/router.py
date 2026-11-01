"""FastAPI router for Grievance Triage domain."""

from __future__ import annotations

import uuid

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    Query,
    Request,
    UploadFile,
    status,
)
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import (
    CurrentUserContext,
    get_current_user_optional,
    get_db,
    require_roles,
)
from app.core.exceptions import ValidationException
from app.core.pagination import ApiEnvelope, PaginationParams
from app.core.storage import storage_service
from app.domains.grievance_triage.schemas import (
    GrievanceTicketDto,
    PublicDashboardDto,
)
from app.domains.grievance_triage.service import grievance_service

router = APIRouter(tags=["Grievance Triage"])


@router.post("/grievances", response_model=ApiEnvelope[GrievanceTicketDto], status_code=status.HTTP_201_CREATED)
async def submit_grievance(
    description: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    address_label: str | None = Form(None),
    category_hint: str | None = Form(None),
    photo_file: UploadFile | None = File(None),
    audio_file: UploadFile | None = File(None),
    current_user: CurrentUserContext | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
) -> ApiEnvelope[GrievanceTicketDto]:
    """Submit a multimodal civic grievance report with GPS coordinates and optional media."""
    photo_bytes = await photo_file.read() if photo_file else None
    audio_bytes = await audio_file.read() if audio_file else None

    ticket = await grievance_service.create_ticket(
        db,
        description=description,
        latitude=latitude,
        longitude=longitude,
        address_label=address_label,
        category_hint=category_hint,
        photo_bytes=photo_bytes,
        photo_filename=photo_file.filename if photo_file else None,
        photo_content_type=photo_file.content_type if photo_file else None,
        audio_bytes=audio_bytes,
        audio_filename=audio_file.filename if audio_file else None,
        audio_content_type=audio_file.content_type if audio_file else None,
        reporter_id=current_user.user_id if current_user else None,
    )
    return ApiEnvelope(data=ticket)


@router.get("/grievances", response_model=ApiEnvelope[list[GrievanceTicketDto]])
async def list_grievances(
    category: str | None = Query(None),
    severity: str | None = Query(None),
    status: str | None = Query(None),
    params: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
) -> ApiEnvelope[list[GrievanceTicketDto]]:
    """List grievances with optional filtering and pagination."""
    tickets, meta = await grievance_service.list_tickets(
        db,
        category=category,
        severity=severity,
        status=status,
        params=params,
    )
    return ApiEnvelope(data=tickets, meta=meta)


@router.get("/grievances/public-dashboard", response_model=ApiEnvelope[PublicDashboardDto])
async def get_public_dashboard(
    db: AsyncSession = Depends(get_db),
) -> ApiEnvelope[PublicDashboardDto]:
    """Unauthenticated public dashboard with SLA compliance, department metrics, and map markers."""
    dashboard = await grievance_service.get_public_dashboard(db)
    return ApiEnvelope(data=dashboard)


@router.get("/grievances/{ticket_id}", response_model=ApiEnvelope[GrievanceTicketDto])
async def get_grievance_by_id(
    ticket_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> ApiEnvelope[GrievanceTicketDto]:
    """Retrieve full details of a specific grievance ticket including its audit timeline."""
    ticket = await grievance_service.get_ticket(db, ticket_id)
    return ApiEnvelope(data=ticket)


@router.patch("/grievances/{ticket_id}/status", response_model=ApiEnvelope[GrievanceTicketDto])
async def update_grievance_status(
    ticket_id: uuid.UUID,
    request: Request,
    current_user: CurrentUserContext = Depends(require_roles(["OFFICER", "ADMIN"])),
    db: AsyncSession = Depends(get_db),
) -> ApiEnvelope[GrievanceTicketDto]:
    """Update grievance status (OFFICER or ADMIN only). Supports JSON or multipart/form-data."""
    content_type = request.headers.get("content-type", "")
    resolution_proof_url: str | None = None
    new_status: str | None = None
    remarks: str | None = None

    if "multipart/form-data" in content_type:
        form = await request.form()
        new_status = form.get("status")  # type: ignore[assignment]
        remarks = form.get("remarks")  # type: ignore[assignment]
        photo = form.get("resolution_photo")
        if isinstance(photo, UploadFile):
            photo_bytes = await photo.read()
            if photo_bytes:
                resolution_proof_url = await storage_service.upload_bytes(
                    data=photo_bytes,
                    folder="grievances/resolutions",
                    filename=photo.filename or "resolution.jpg",
                    content_type=photo.content_type or "image/jpeg",
                )
    else:
        body = await request.json()
        new_status = body.get("status")
        remarks = body.get("remarks")
        resolution_proof_url = body.get("proof_url")

    if not new_status or not remarks:
        raise ValidationException("Both 'status' and 'remarks' are required.")

    updated_ticket = await grievance_service.update_ticket_status(
        db,
        ticket_id=ticket_id,
        new_status=new_status,
        remarks=remarks,
        actor_id=current_user.user_id,
        resolution_proof_url=resolution_proof_url,
    )
    return ApiEnvelope(data=updated_ticket)
