"""Service layer for Bureaucracy Agent domain."""

from __future__ import annotations

import asyncio
import logging
import uuid
from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.core.exceptions import NotFoundException
from app.domains.bureaucracy_agent.hitl_coordinator import supply_hitl_input
from app.domains.bureaucracy_agent.models import AgentActionStep, ServiceExecutionRun
from app.domains.bureaucracy_agent.playwright_runner import (
    execute_bureaucracy_workflow,
    validate_portal_url,
)
from app.domains.bureaucracy_agent.schemas import (
    AgentActionStepDto,
    AgentRunCreateRequest,
    AgentRunDetailDto,
    HitlSupplyInputRequest,
)

logger = logging.getLogger(__name__)


def _run_to_dto(
    run: ServiceExecutionRun,
    steps: Sequence[AgentActionStep] = (),
) -> AgentRunDetailDto:
    """Map ServiceExecutionRun ORM model to AgentRunDetailDto."""
    return AgentRunDetailDto(
        run_id=run.id,
        service_code=run.service_code,
        portal_url=run.portal_url,
        status=run.status,
        obstacle_type=run.obstacle_type,
        prompt_message=run.prompt_message,
        obstacle_screenshot_url=run.obstacle_screenshot_url,
        tracking_receipt_id=run.tracking_receipt_id,
        receipt_pdf_url=run.receipt_pdf_url,
        error_detail=run.error_detail,
        started_at=run.started_at,
        completed_at=run.completed_at,
        created_at=run.created_at,
        steps=[AgentActionStepDto.model_validate(s) for s in steps],
    )


class BureaucracyAgentService:
    """Coordinates autonomous bureaucracy runs, step recording, and HITL unblocking."""

    async def create_run(
        self,
        db: AsyncSession,
        *,
        user_id: uuid.UUID,
        payload: AgentRunCreateRequest,
    ) -> AgentRunDetailDto:
        """Validate target portal, record initial run row, and dispatch background automation."""
        portal_url = payload.portal_url or f"http://localhost:8000/mock-gov-portal/{payload.service_code}"
        validate_portal_url(portal_url)

        run = ServiceExecutionRun(
            id=uuid.uuid4(),
            user_id=user_id,
            service_code=payload.service_code,
            portal_url=portal_url,
            status="QUEUED",
        )
        db.add(run)
        await db.commit()
        await db.refresh(run)

        # Dispatch background runner task with independent database session
        async def _background_runner(r_id: uuid.UUID, u_id: uuid.UUID, s_code: str, p_url: str, otp: str | None) -> None:
            async with AsyncSessionLocal() as bg_db:
                try:
                    await execute_bureaucracy_workflow(
                        bg_db,
                        run_id=r_id,
                        user_id=u_id,
                        service_code=s_code,
                        portal_url=p_url,
                        auto_solve_hitl_otp=otp,
                    )
                except Exception as exc:
                    logger.exception("Background bureaucracy workflow exception: %s", exc)

        asyncio.create_task(
            _background_runner(
                run.id,
                user_id,
                payload.service_code,
                portal_url,
                payload.auto_solve_hitl_otp,
            )
        )

        # Brief yield to allow background task to start
        await asyncio.sleep(0.05)
        return await self.get_run(db, run.id)

    async def get_run(self, db: AsyncSession, run_id: uuid.UUID) -> AgentRunDetailDto:
        """Fetch run details along with chronological action steps."""
        stmt = select(ServiceExecutionRun).where(ServiceExecutionRun.id == run_id)
        res = await db.execute(stmt)
        run = res.scalar_one_or_none()
        if not run:
            raise NotFoundException("Service execution run not found.")

        steps_stmt = (
            select(AgentActionStep)
            .where(AgentActionStep.run_id == run_id)
            .order_by(AgentActionStep.step_number.asc())
        )
        steps_res = await db.execute(steps_stmt)
        steps = steps_res.scalars().all()

        return _run_to_dto(run, steps)

    async def list_runs(self, db: AsyncSession, user_id: uuid.UUID) -> list[AgentRunDetailDto]:
        """List all bureaucracy runs initiated by the user."""
        stmt = (
            select(ServiceExecutionRun)
            .where(ServiceExecutionRun.user_id == user_id)
            .order_by(ServiceExecutionRun.created_at.desc())
        )
        res = await db.execute(stmt)
        runs = res.scalars().all()
        return [_run_to_dto(r, []) for r in runs]

    async def submit_hitl_input(
        self,
        db: AsyncSession,
        *,
        run_id: uuid.UUID,
        payload: HitlSupplyInputRequest,
    ) -> AgentRunDetailDto:
        """Deliver citizen OTP/CAPTCHA response to the coordinator and unblock the runner."""
        stmt = select(ServiceExecutionRun).where(ServiceExecutionRun.id == run_id)
        res = await db.execute(stmt)
        run = res.scalar_one_or_none()
        if not run:
            raise NotFoundException("Service execution run not found.")

        await supply_hitl_input(
            run_id=run_id,
            obstacle_type=payload.obstacle_type,
            user_input=payload.user_input,
        )

        # Brief yield to allow background task to resume
        await asyncio.sleep(0.15)
        return await self.get_run(db, run_id)


bureaucracy_service = BureaucracyAgentService()
