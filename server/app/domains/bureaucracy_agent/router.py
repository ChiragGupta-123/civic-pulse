"""FastAPI router for Bureaucracy Agent domain."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import (
    CurrentUserContext,
    get_current_user_optional,
    get_db,
)
from app.core.pagination import ApiEnvelope
from app.domains.bureaucracy_agent.schemas import (
    AgentRunCreateRequest,
    AgentRunDetailDto,
    HitlSupplyInputRequest,
)
from app.domains.bureaucracy_agent.service import bureaucracy_service
from app.domains.identity.models import User

router = APIRouter(tags=["Bureaucracy Agent"])


async def _resolve_user_id(
    current_user: CurrentUserContext | None,
    db: AsyncSession,
) -> uuid.UUID:
    """Resolve user id from JWT or fall back to demo citizen in development/testing."""
    if current_user:
        return current_user.user_id

    res = await db.execute(select(User).limit(1))
    demo_user = res.scalar_one_or_none()
    if demo_user:
        return demo_user.id
    return uuid.uuid4()


@router.post(
    "/agent/runs",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=ApiEnvelope[AgentRunDetailDto],
)
async def create_agent_run(
    payload: AgentRunCreateRequest,
    current_user: CurrentUserContext | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
) -> ApiEnvelope[AgentRunDetailDto]:
    """Dispatch an autonomous public service execution run."""
    user_id = await _resolve_user_id(current_user, db)
    run_detail = await bureaucracy_service.create_run(
        db,
        user_id=user_id,
        payload=payload,
    )
    return ApiEnvelope(data=run_detail)


@router.get(
    "/agent/runs",
    response_model=ApiEnvelope[list[AgentRunDetailDto]],
)
async def list_agent_runs(
    current_user: CurrentUserContext | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
) -> ApiEnvelope[list[AgentRunDetailDto]]:
    """List all agent runs initiated by the current user."""
    user_id = await _resolve_user_id(current_user, db)
    runs = await bureaucracy_service.list_runs(db, user_id=user_id)
    return ApiEnvelope(data=runs)


@router.get(
    "/agent/runs/{run_id}",
    response_model=ApiEnvelope[AgentRunDetailDto],
)
async def get_agent_run(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> ApiEnvelope[AgentRunDetailDto]:
    """Retrieve execution details, live status, and action step audit timeline."""
    run_detail = await bureaucracy_service.get_run(db, run_id=run_id)
    return ApiEnvelope(data=run_detail)


@router.post(
    "/agent/runs/{run_id}/hitl",
    response_model=ApiEnvelope[AgentRunDetailDto],
)
async def submit_hitl_solution(
    run_id: uuid.UUID,
    payload: HitlSupplyInputRequest,
    db: AsyncSession = Depends(get_db),
) -> ApiEnvelope[AgentRunDetailDto]:
    """Supply Human-in-the-Loop authorization input (SMS OTP or CAPTCHA) to unblock the agent."""
    updated_run = await bureaucracy_service.submit_hitl_input(
        db,
        run_id=run_id,
        payload=payload,
    )
    return ApiEnvelope(data=updated_run)
