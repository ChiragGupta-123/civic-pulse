"""Tests for Phase 1 models, migration 002, and fact verification registry seeding."""

from __future__ import annotations

import datetime
import socket
import sys
import uuid
from pathlib import Path
from urllib.parse import urlparse

_REPO_ROOT = Path(__file__).resolve().parents[2]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

import pytest  # noqa: E402
from infra.seeds.seed_verification_registry import (  # noqa: E402
    VERIFIED_FACTS,
    compute_deterministic_embedding,
    seed_verification_registry,
)
from sqlalchemy import func, select, text  # noqa: E402

from app.core.database import AsyncSessionLocal  # noqa: E402
from app.core.settings import get_settings  # noqa: E402
from app.domains.bureaucracy_agent.models import AgentActionStep, ServiceExecutionRun  # noqa: E402
from app.domains.fact_verification.models import (  # noqa: E402
    ClaimSubmission,
    ForensicAuditResult,
    TrustedFactRecord,
)


def _is_postgres_reachable() -> bool:
    url = urlparse(get_settings().SYNC_DATABASE_URL)
    host = url.hostname or "localhost"
    port = url.port or 5433
    try:
        with socket.create_connection((host, port), timeout=1.5):
            return True
    except OSError:
        return False


def test_model_instantiation() -> None:
    """Verify all 5 ORM models can be instantiated with valid attributes."""
    run_id = uuid.uuid4()
    user_id = uuid.uuid4()

    run = ServiceExecutionRun(
        id=run_id,
        user_id=user_id,
        service_code="SCHOLARSHIP_RENEWAL",
        portal_url="http://localhost:8000/mock-gov-portal/SCHOLARSHIP_RENEWAL",
        status="QUEUED",
    )
    assert run.service_code == "SCHOLARSHIP_RENEWAL"
    assert run.status == "QUEUED"

    step = AgentActionStep(
        run_id=run_id,
        step_number=1,
        action="NAVIGATE",
        detail="Navigating to portal",
        status="SUCCESS",
    )
    assert step.step_number == 1
    assert step.action == "NAVIGATE"

    emb = compute_deterministic_embedding("test canonical fact")
    assert len(emb) == 1536

    fact = TrustedFactRecord(
        reference_code="GOV-FACT-TEST-001",
        canonical_fact="Test fact",
        authority_name="Test Authority",
        source_url="https://gov.in",
        knowledge_triples=[{"subject": "A", "predicate": "B", "object": "C"}],
        embedding=emb,
        effective_date=datetime.date(2026, 1, 1),
    )
    assert fact.reference_code == "GOV-FACT-TEST-001"
    assert len(fact.embedding) == 1536

    claim = ClaimSubmission(
        claim_text="Test claim",
        media_type="TEXT_ONLY",
        status="COMPLETED",
    )
    assert claim.claim_text == "Test claim"

    audit = ForensicAuditResult(
        claim_id=claim.id,
        verdict="VERIFIED_TRUE",
        confidence_score=95,
        credibility_rating=90,
        c2pa_status="MANIFEST_VALID",
        is_deepfake_suspected=False,
        synthetic_probability=0.05,
        explanation_summary="Verified truth from official gazette.",
    )
    assert audit.verdict == "VERIFIED_TRUE"


@pytest.mark.asyncio
async def test_live_tables_and_vector_query() -> None:
    """Verify tables exist in live PostgreSQL and vector cosine distance query works."""
    if not _is_postgres_reachable():
        pytest.skip("PostgreSQL (port 5433) is unreachable; skipping live DB test.")

    async with AsyncSessionLocal() as session:
        # Check table presence
        result = await session.execute(
            text(
                "SELECT table_name FROM information_schema.tables WHERE table_name IN "
                "('service_execution_runs', 'agent_action_steps', 'trusted_fact_records', "
                "'claim_submissions', 'forensic_audit_results')"
            )
        )
        tables = {row[0] for row in result.fetchall()}
        expected = {
            "service_execution_runs",
            "agent_action_steps",
            "trusted_fact_records",
            "claim_submissions",
            "forensic_audit_results",
        }
        assert expected.issubset(tables), f"Missing tables: {expected - tables}"

        # Test seeding logic idempotently
        await seed_verification_registry(session)

        # Verify all 6 seeded facts are present
        res = await session.execute(select(func.count(TrustedFactRecord.id)))
        count = res.scalar_one()
        assert count >= len(VERIFIED_FACTS)

        # Test pgvector cosine search query
        query_emb = compute_deterministic_embedding("Ration Card distribution NFSA subsidies")
        cosine_stmt = (
            select(
                TrustedFactRecord.reference_code,
                TrustedFactRecord.embedding.cosine_distance(query_emb).label("distance"),
            )
            .order_by("distance")
            .limit(1)
        )
        top_match = (await session.execute(cosine_stmt)).first()
        assert top_match is not None
        assert top_match.reference_code == "GOV-FACT-RATION-2026"
        assert top_match.distance < 0.6
