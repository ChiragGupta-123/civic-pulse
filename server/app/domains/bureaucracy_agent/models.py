"""Bureaucracy agent domain ORM models.

Two tables track autonomous public-service executions and step-by-step
browser actions:

* ``service_execution_runs`` — top-level run records, portal URLs, status,
  HITL challenge state, and generated tracking receipt IDs.
* ``agent_action_steps`` — chronological action timeline with screenshot URLs
  and step metadata.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ServiceExecutionRun(Base):
    """An autonomous execution session dispatched across an e-gov portal."""

    __tablename__ = "service_execution_runs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    vault_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("citizen_vaults.id", ondelete="SET NULL"), nullable=True
    )
    service_code: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    portal_url: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(40), index=True, default="QUEUED", nullable=False
    )
    obstacle_type: Mapped[str | None] = mapped_column(String(40), nullable=True)
    prompt_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    obstacle_screenshot_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    tracking_receipt_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    receipt_pdf_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_detail: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    steps: Mapped[list[AgentActionStep]] = relationship(
        "AgentActionStep",
        back_populates="run",
        cascade="all, delete-orphan",
        order_by="AgentActionStep.step_number",
    )


class AgentActionStep(Base):
    """A granular browser automation step recorded during an execution run."""

    __tablename__ = "agent_action_steps"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    run_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("service_execution_runs.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    step_number: Mapped[int] = mapped_column(Integer, nullable=False)
    action: Mapped[str] = mapped_column(String(60), nullable=False)
    detail: Mapped[str] = mapped_column(Text, nullable=False)
    screenshot_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="SUCCESS", nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    run: Mapped[ServiceExecutionRun] = relationship(
        "ServiceExecutionRun", back_populates="steps"
    )
