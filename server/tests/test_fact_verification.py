"""Tests for Pillar 4 — Fact-Verification & Deepfake Audit Engine."""

from __future__ import annotations

import io
import uuid

import httpx
import pytest
from PIL import Image
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.security import create_access_token
from app.domains.fact_verification.c2pa_inspector import inspect_c2pa_provenance
from app.domains.fact_verification.media_forensics import analyze_media_authenticity
from app.domains.identity.models import User


def _create_sample_jpeg(text_marker: bytes = b"") -> bytes:
    """Create a sample 200x200 JPEG image in memory with optional embedded marker bytes."""
    img = Image.new("RGB", (200, 200), color=(180, 70, 50))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    raw = buf.getvalue()
    if text_marker:
        raw += b"\x00" + text_marker
    return raw


@pytest.fixture
async def officer_token() -> str:
    """Fetch seeded officer user and return a signed JWT token."""
    async with AsyncSessionLocal() as session:
        res = await session.execute(
            select(User).where(User.email == "officer@civicpulse.gov.in")
        )
        officer = res.scalar_one_or_none()
        if not officer:
            officer = User(
                id=uuid.uuid4(),
                email="officer@civicpulse.gov.in",
                password_hash="test",
                full_name="Test Officer",
                role="OFFICER",
                preferred_language="en-IN",
            )
            session.add(officer)
            await session.commit()
            await session.refresh(officer)
        return create_access_token(subject=str(officer.id), role="OFFICER")


def test_c2pa_inspector_logic() -> None:
    """Verify C2PA provenance detection for missing, valid, and tampered manifests."""
    # 1. Missing
    res_none = inspect_c2pa_provenance(None)
    assert res_none["c2pa_status"] == "MANIFEST_MISSING"

    # 2. Tampered
    tampered_bytes = b"header_data...c2pa...TAMPERED_HASH...footer"
    res_tampered = inspect_c2pa_provenance(tampered_bytes)
    assert res_tampered["c2pa_status"] == "MANIFEST_TAMPERED"

    # 3. Valid
    valid_bytes = b"header_data...c2pa...jumb_box...valid_signature"
    res_valid = inspect_c2pa_provenance(valid_bytes)
    assert res_valid["c2pa_status"] == "MANIFEST_VALID"
    assert res_valid["c2pa_issuer"] is not None


@pytest.mark.asyncio
async def test_media_forensics_ela_heatmap() -> None:
    """Verify ELA heatmap generation, perceptual hashing, and SHA-256 fingerprinting."""
    sample_img = _create_sample_jpeg()
    res = await analyze_media_authenticity(
        media_bytes=sample_img,
        filename="sample.jpg",
        content_type="image/jpeg",
        claim_id=str(uuid.uuid4()),
    )
    assert res["media_type"] == "IMAGE"
    assert res["sha256"] is not None
    assert res["phash"] is not None
    assert res["ela_heatmap_url"] is not None
    assert res["ela_heatmap_url"].endswith(".png")
    assert 0.0 <= res["synthetic_probability"] <= 1.0


@pytest.mark.asyncio
async def test_audit_verified_true_claim(client: httpx.AsyncClient) -> None:
    """Verify official truth query achieves high credibility and citations."""
    claim_payload = {
        "claim_text": "Post-matric scholarship family income ceiling remains at INR 2.50 Lakhs per annum under UGC guidelines.",
        "source_url": "https://pib.gov.in/FactCheck/scholarship",
    }
    resp = await client.post("/api/v1/fact-checks/audit", json=claim_payload)
    assert resp.status_code == 201, resp.text
    data = resp.json()["data"]

    assert data["claim_text"] == claim_payload["claim_text"]
    assert data["audit_result"] is not None
    audit = data["audit_result"]
    assert audit["verdict"] in ("VERIFIED_TRUE", "MISLEADING")
    assert audit["credibility_rating"] >= 70
    assert len(audit["evidence_citations"]) >= 1
    assert len(audit["provenance_nodes"]) == 5


@pytest.mark.asyncio
async def test_audit_manipulated_deepfake_image(client: httpx.AsyncClient) -> None:
    """Verify manipulated media triggers SYNTHETIC_OR_MANIPULATED verdict with low credibility."""
    manipulated_img = _create_sample_jpeg(text_marker=b"c2pa_tampered_synthetic_deepfake_payload")
    files = {
        "media_file": ("viral_leak.jpg", io.BytesIO(manipulated_img), "image/jpeg"),
    }
    data = {
        "claim_text": "Viral photo showing sudden collapse of newly inaugurated expressway bridge.",
        "source_url": "https://socialmedia.example/post/999",
    }

    resp = await client.post("/api/v1/fact-checks/audit", data=data, files=files)
    assert resp.status_code == 201, resp.text
    data = resp.json()["data"]

    audit = data["audit_result"]
    assert audit["verdict"] == "SYNTHETIC_OR_MANIPULATED"
    assert audit["credibility_rating"] <= 30
    assert audit["is_deepfake_suspected"] is True
    assert audit["ela_heatmap_url"] is not None


@pytest.mark.asyncio
async def test_fact_checks_feed_and_detail(client: httpx.AsyncClient) -> None:
    """Verify GET /api/v1/fact-checks/feed and GET /api/v1/fact-checks/{claim_id}."""
    # 1. Create a claim
    resp = await client.post(
        "/api/v1/fact-checks/audit",
        json={"claim_text": "Government announced 50% discount on municipal electricity bills."},
    )
    assert resp.status_code == 201
    claim_id = resp.json()["data"]["id"]

    # 2. Feed
    feed_resp = await client.get("/api/v1/fact-checks/feed")
    assert feed_resp.status_code == 200
    feed_body = feed_resp.json()
    assert len(feed_body["data"]) >= 1
    assert feed_body["meta"]["total_items"] >= 1

    # 3. Detail
    detail_resp = await client.get(f"/api/v1/fact-checks/{claim_id}")
    assert detail_resp.status_code == 200
    detail_data = detail_resp.json()["data"]
    assert detail_data["id"] == claim_id
    assert len(detail_data["audit_result"]["provenance_nodes"]) >= 1


@pytest.mark.asyncio
async def test_register_trusted_fact_rbac(
    client: httpx.AsyncClient,
    officer_token: str,
) -> None:
    """Verify POST /api/v1/fact-checks/registry is guarded by officer/admin role."""
    code = f"FACT-TEST-{uuid.uuid4().hex[:6].upper()}"
    fact_payload = {
        "reference_code": code,
        "canonical_fact": "State government solar rooftop subsidy provides up to 40% capital incentive.",
        "authority_name": "New and Renewable Energy Department",
        "source_url": "https://energy.gov.in/solar-rooftop",
    }

    # 1. Unauthenticated request -> 401
    unauth_resp = await client.post("/api/v1/fact-checks/registry", json=fact_payload)
    assert unauth_resp.status_code == 401

    # 2. Authenticated officer request -> 201
    headers = {"Authorization": f"Bearer {officer_token}"}
    auth_resp = await client.post(
        "/api/v1/fact-checks/registry",
        json=fact_payload,
        headers=headers,
    )
    assert auth_resp.status_code == 201
    body = auth_resp.json()["data"]
    assert body["reference_code"] == code
    assert body["authority_name"] == fact_payload["authority_name"]
