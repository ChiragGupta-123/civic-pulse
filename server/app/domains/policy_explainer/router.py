"""FastAPI router for Policy Explainer domain endpoints."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUserContext, get_current_user_optional, get_db
from app.core.pagination import ApiEnvelope
from app.domains.policy_explainer.schemas import (
    PolicyExplainerDto,
    PolicyExplainRequest,
    PolicySummaryDto,
)
from app.domains.policy_explainer.service import PolicyExplainerService

router = APIRouter(prefix="", tags=["Policy Explainer"])


@router.post(
    "/policies",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiEnvelope[PolicySummaryDto],
)
async def upload_policy(
    file: UploadFile = File(...),
    title: str = Form(...),
    reference_code: str = Form(...),
    doc_type: str = Form("WELFARE_SCHEME"),
    issuing_body: str = Form(...),
    target_group: str = Form("CITIZEN"),
    db: AsyncSession = Depends(get_db),
    user: CurrentUserContext | None = Depends(get_current_user_optional),
) -> ApiEnvelope[PolicySummaryDto]:
    """Upload and chunk an official government notification PDF."""
    pdf_bytes = await file.read()
    uploader_id = user.user_id if user else None
    dto = await PolicyExplainerService.create_policy_document(
        db=db,
        file_bytes=pdf_bytes,
        filename=file.filename or f"{reference_code}.pdf",
        title=title,
        reference_code=reference_code,
        doc_type=doc_type,
        issuing_body=issuing_body,
        target_group=target_group,
        uploaded_by=uploader_id,
    )
    return ApiEnvelope(data=dto)


@router.get(
    "/policies",
    status_code=status.HTTP_200_OK,
    response_model=ApiEnvelope[list[PolicySummaryDto]],
)
async def list_policies(
    search: str | None = Query(default=None),
    doc_type: str | None = Query(default=None),
    target_group: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
) -> ApiEnvelope[list[PolicySummaryDto]]:
    """List and search indexed government policies."""
    items, meta = await PolicyExplainerService.list_policies(
        db=db,
        search=search,
        doc_type=doc_type,
        target_group=target_group,
        page=page,
        page_size=page_size,
    )
    return ApiEnvelope(data=items, meta=meta)


@router.get(
    "/policies/{policy_id}",
    status_code=status.HTTP_200_OK,
    response_model=ApiEnvelope[PolicySummaryDto],
)
async def get_policy_detail(
    policy_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> ApiEnvelope[PolicySummaryDto]:
    """Retrieve metadata of a specific policy document."""
    dto = await PolicyExplainerService.get_policy_by_id(db=db, policy_id=policy_id)
    return ApiEnvelope(data=dto)


@router.post(
    "/policies/{policy_id}/explain",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiEnvelope[PolicyExplainerDto],
)
async def explain_policy(
    policy_id: uuid.UUID,
    payload: PolicyExplainRequest,
    db: AsyncSession = Depends(get_db),
    user: CurrentUserContext | None = Depends(get_current_user_optional),
) -> ApiEnvelope[PolicyExplainerDto]:
    """Generate personalized RAG eligibility evaluation and regional voice audio (.mp3)."""
    user_id = user.user_id if user else None
    dto = await PolicyExplainerService.explain_policy_for_user(
        db=db,
        policy_id=policy_id,
        request=payload,
        user_id=user_id,
    )
    return ApiEnvelope(data=dto)
