"""FastAPI router for Fact-Verification & Deepfake Audit domain."""

from __future__ import annotations

import uuid

from fastapi import (
    APIRouter,
    Depends,
    Request,
    status,
)
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.datastructures import UploadFile

from app.core.dependencies import (
    CurrentUserContext,
    get_current_user_optional,
    get_db,
    require_roles,
)
from app.core.pagination import ApiEnvelope, PaginationParams
from app.domains.fact_verification.schemas import (
    ClaimAuditDetailDto,
    TrustedFactRecordCreateRequest,
    TrustedFactRecordDto,
)
from app.domains.fact_verification.service import fact_verification_service

router = APIRouter(tags=["Fact Verification"])


@router.post(
    "/fact-checks/audit",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiEnvelope[ClaimAuditDetailDto],
)
async def audit_claim(
    request: Request,
    current_user: CurrentUserContext | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
) -> ApiEnvelope[ClaimAuditDetailDto]:
    """Audit a claim or uploaded media asset for authenticity, C2PA, and truth cross-examination."""
    content_type = request.headers.get("content-type", "")

    claim_text: str = ""
    source_url: str | None = None
    media_bytes: bytes | None = None
    media_filename: str | None = None
    media_content_type: str | None = None

    if "multipart/form-data" in content_type:
        form = await request.form()
        claim_text = str(form.get("claim_text") or "")
        source_url = str(form.get("source_url")) if form.get("source_url") else None
        file_obj = form.get("media_file") or form.get("file")
        if isinstance(file_obj, UploadFile):
            media_bytes = await file_obj.read()
            media_filename = file_obj.filename
            media_content_type = file_obj.content_type
    else:
        body = await request.json()
        claim_text = body.get("claim_text", "")
        source_url = body.get("source_url")

    audit = await fact_verification_service.audit_claim(
        db,
        claim_text=claim_text,
        source_url=source_url,
        media_bytes=media_bytes,
        media_filename=media_filename,
        media_content_type=media_content_type,
        submitted_by=current_user.user_id if current_user else None,
    )
    return ApiEnvelope(data=audit)


@router.get(
    "/fact-checks/feed",
    response_model=ApiEnvelope[list[ClaimAuditDetailDto]],
)
async def list_fact_checks_feed(
    params: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
) -> ApiEnvelope[list[ClaimAuditDetailDto]]:
    """Public feed of audited claims and deepfake forensics."""
    claims, meta = await fact_verification_service.list_audits(db, params=params)
    return ApiEnvelope(data=claims, meta=meta)


@router.get(
    "/fact-checks/{claim_id}",
    response_model=ApiEnvelope[ClaimAuditDetailDto],
)
async def get_claim_audit_detail(
    claim_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> ApiEnvelope[ClaimAuditDetailDto]:
    """Retrieve full forensic breakdown, ELA heatmap URL, and provenance nodes by claim ID."""
    detail = await fact_verification_service.get_audit_by_id(db, claim_id=claim_id)
    return ApiEnvelope(data=detail)


@router.post(
    "/fact-checks/registry",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiEnvelope[TrustedFactRecordDto],
)
async def register_trusted_fact(
    payload: TrustedFactRecordCreateRequest,
    current_user: CurrentUserContext = Depends(require_roles(["OFFICER", "ADMIN"])),
    db: AsyncSession = Depends(get_db),
) -> ApiEnvelope[TrustedFactRecordDto]:
    """Register an official government truth into the vector knowledge registry."""
    record = await fact_verification_service.create_trusted_fact(db, payload=payload)
    return ApiEnvelope(data=record)
