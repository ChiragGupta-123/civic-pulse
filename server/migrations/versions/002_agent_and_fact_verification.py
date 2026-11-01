"""Agent and fact-verification schema.

Creates the remaining five tables for Civic Pulse:
1. service_execution_runs
2. agent_action_steps
3. trusted_fact_records (with HNSW vector index)
4. claim_submissions
5. forensic_audit_results

Revision ID: 002
Revises: 001
Create Date: 2026-10-31
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from pgvector.sqlalchemy import Vector
from sqlalchemy.dialects import postgresql

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None

_JSONB = postgresql.JSONB(astext_type=sa.Text())
_UUID = postgresql.UUID(as_uuid=True)
_NOW = sa.text("now()")


def upgrade() -> None:
    # ------------------------------------------------------------------ #
    # 1. service_execution_runs
    # ------------------------------------------------------------------ #
    op.create_table(
        "service_execution_runs",
        sa.Column("id", _UUID, nullable=False),
        sa.Column("user_id", _UUID, nullable=False),
        sa.Column("vault_id", _UUID, nullable=True),
        sa.Column("service_code", sa.String(length=80), nullable=False),
        sa.Column("portal_url", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=40), server_default="QUEUED", nullable=False),
        sa.Column("obstacle_type", sa.String(length=40), nullable=True),
        sa.Column("prompt_message", sa.Text(), nullable=True),
        sa.Column("obstacle_screenshot_url", sa.Text(), nullable=True),
        sa.Column("tracking_receipt_id", sa.String(length=120), nullable=True),
        sa.Column("receipt_pdf_url", sa.Text(), nullable=True),
        sa.Column("error_detail", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=_NOW,
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name="fk_service_execution_runs_user_id_users",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["vault_id"],
            ["citizen_vaults.id"],
            name="fk_service_execution_runs_vault_id_citizen_vaults",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_service_execution_runs"),
    )
    op.create_index(
        "ix_service_execution_runs_user_id",
        "service_execution_runs",
        ["user_id"],
    )
    op.create_index(
        "ix_service_execution_runs_service_code",
        "service_execution_runs",
        ["service_code"],
    )
    op.create_index(
        "ix_service_execution_runs_status",
        "service_execution_runs",
        ["status"],
    )

    # ------------------------------------------------------------------ #
    # 2. agent_action_steps
    # ------------------------------------------------------------------ #
    op.create_table(
        "agent_action_steps",
        sa.Column("id", _UUID, nullable=False),
        sa.Column("run_id", _UUID, nullable=False),
        sa.Column("step_number", sa.Integer(), nullable=False),
        sa.Column("action", sa.String(length=60), nullable=False),
        sa.Column("detail", sa.Text(), nullable=False),
        sa.Column("screenshot_url", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=30), server_default="SUCCESS", nullable=False),
        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            server_default=_NOW,
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["run_id"],
            ["service_execution_runs.id"],
            name="fk_agent_action_steps_run_id_service_execution_runs",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_agent_action_steps"),
    )
    op.create_index(
        "ix_agent_action_steps_run_id",
        "agent_action_steps",
        ["run_id"],
    )

    # ------------------------------------------------------------------ #
    # 3. trusted_fact_records
    # ------------------------------------------------------------------ #
    op.create_table(
        "trusted_fact_records",
        sa.Column("id", _UUID, nullable=False),
        sa.Column("reference_code", sa.String(length=100), nullable=False),
        sa.Column("canonical_fact", sa.Text(), nullable=False),
        sa.Column("authority_name", sa.String(length=200), nullable=False),
        sa.Column("source_url", sa.Text(), nullable=False),
        sa.Column(
            "knowledge_triples",
            _JSONB,
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column("embedding", Vector(1536), nullable=False),
        sa.Column("effective_date", sa.Date(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=_NOW,
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name="pk_trusted_fact_records"),
    )
    op.create_index(
        "ix_trusted_fact_records_reference_code",
        "trusted_fact_records",
        ["reference_code"],
        unique=True,
    )
    op.create_index(
        "ix_trusted_fact_records_embedding_hnsw",
        "trusted_fact_records",
        ["embedding"],
        postgresql_using="hnsw",
        postgresql_ops={"embedding": "vector_cosine_ops"},
    )

    # ------------------------------------------------------------------ #
    # 4. claim_submissions
    # ------------------------------------------------------------------ #
    op.create_table(
        "claim_submissions",
        sa.Column("id", _UUID, nullable=False),
        sa.Column("submitted_by", _UUID, nullable=True),
        sa.Column("claim_text", sa.Text(), nullable=False),
        sa.Column("source_url", sa.Text(), nullable=True),
        sa.Column(
            "media_type",
            sa.String(length=30),
            server_default="TEXT_ONLY",
            nullable=False,
        ),
        sa.Column("media_url", sa.Text(), nullable=True),
        sa.Column("media_sha256", sa.String(length=64), nullable=True),
        sa.Column("media_phash", sa.String(length=64), nullable=True),
        sa.Column(
            "status",
            sa.String(length=30),
            server_default="COMPLETED",
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=_NOW,
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["submitted_by"],
            ["users.id"],
            name="fk_claim_submissions_submitted_by_users",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_claim_submissions"),
    )
    op.create_index(
        "ix_claim_submissions_media_sha256",
        "claim_submissions",
        ["media_sha256"],
    )
    op.create_index(
        "ix_claim_submissions_media_phash",
        "claim_submissions",
        ["media_phash"],
    )

    # ------------------------------------------------------------------ #
    # 5. forensic_audit_results
    # ------------------------------------------------------------------ #
    op.create_table(
        "forensic_audit_results",
        sa.Column("id", _UUID, nullable=False),
        sa.Column("claim_id", _UUID, nullable=False),
        sa.Column("verdict", sa.String(length=50), nullable=False),
        sa.Column("confidence_score", sa.Integer(), nullable=False),
        sa.Column("credibility_rating", sa.Integer(), nullable=False),
        sa.Column(
            "c2pa_status",
            sa.String(length=40),
            server_default="MANIFEST_MISSING",
            nullable=False,
        ),
        sa.Column("c2pa_issuer", sa.String(length=200), nullable=True),
        sa.Column(
            "is_deepfake_suspected",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "synthetic_probability",
            sa.Float(),
            server_default=sa.text("0.0"),
            nullable=False,
        ),
        sa.Column("ela_heatmap_url", sa.Text(), nullable=True),
        sa.Column(
            "technical_findings",
            _JSONB,
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column(
            "evidence_citations",
            _JSONB,
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column(
            "provenance_nodes",
            _JSONB,
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column("explanation_summary", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=_NOW,
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["claim_id"],
            ["claim_submissions.id"],
            name="fk_forensic_audit_results_claim_id_claim_submissions",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_forensic_audit_results"),
    )
    op.create_index(
        "ix_forensic_audit_results_claim_id",
        "forensic_audit_results",
        ["claim_id"],
        unique=True,
    )
    op.create_index(
        "ix_forensic_audit_results_verdict",
        "forensic_audit_results",
        ["verdict"],
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS forensic_audit_results CASCADE")
    op.execute("DROP TABLE IF EXISTS claim_submissions CASCADE")
    op.execute("DROP TABLE IF EXISTS trusted_fact_records CASCADE")
    op.execute("DROP TABLE IF EXISTS agent_action_steps CASCADE")
    op.execute("DROP TABLE IF EXISTS service_execution_runs CASCADE")
