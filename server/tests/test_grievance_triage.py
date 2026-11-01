"""Tests for Pillar 2 — Civic Grievance Triage & Accountability."""

from __future__ import annotations

import io
import uuid
from datetime import datetime

import httpx
import pytest
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.security import create_access_token
from app.domains.identity.models import User


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


@pytest.mark.asyncio
async def test_critical_water_leak_intake_and_sla(client: httpx.AsyncClient) -> None:
    """Submit a critical water leak report with photo + audio and verify 4-hour SLA routing."""
    fake_photo = io.BytesIO(b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb")
    fake_audio = io.BytesIO(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00")

    base_lat = 28.0 + (uuid.uuid4().int % 10000) * 0.001
    base_lon = 77.0 + (uuid.uuid4().int % 10000) * 0.001

    files = {
        "photo_file": ("flood.jpg", fake_photo, "image/jpeg"),
        "audio_file": ("complaint.wav", fake_audio, "audio/wav"),
    }
    data = {
        "description": "Emergency! High pressure municipal water pipe burst near station causing massive flooding!",
        "latitude": str(base_lat),
        "longitude": str(base_lon),
        "address_label": "Station Road Cross, New Delhi",
        "category_hint": "WATER_LEAK",
    }

    resp = await client.post("/api/v1/grievances", data=data, files=files)
    assert resp.status_code == 201, resp.text
    body = resp.json()["data"]

    assert body["category"] == "WATER_LEAK"
    assert body["severity"] == "CRITICAL"
    assert body["severity_score"] >= 90
    assert body["routed_department"]["code"] == "MUNICIPAL_WATER_BOARD"
    assert body["duplicate_of_id"] is None
    assert body["upvote_count"] == 1
    assert len(body["media_urls"]) == 2

    # Verify SLA is ~4 hours
    deadline = datetime.fromisoformat(body["sla_deadline"].replace("Z", "+00:00"))
    created = datetime.fromisoformat(body["created_at"].replace("Z", "+00:00"))
    diff_hours = (deadline - created).total_seconds() / 3600.0
    assert 3.8 <= diff_hours <= 4.2


@pytest.mark.asyncio
async def test_spatial_deduplication_15m_and_500m(client: httpx.AsyncClient) -> None:
    """Verify tickets within 50m link to primary ticket and increment upvotes, while 500m stays independent."""
    base_lat = 25.0 + (uuid.uuid4().int % 10000) * 0.001
    base_lon = 75.0 + (uuid.uuid4().int % 10000) * 0.001

    # 1. Primary ticket
    data_primary = {
        "description": "Main water pipeline burst flooding the market entrance.",
        "latitude": str(base_lat),
        "longitude": str(base_lon),
        "address_label": "Market Gate 1, Sector 18",
        "category_hint": "WATER_LEAK",
    }
    resp1 = await client.post("/api/v1/grievances", data=data_primary)
    assert resp1.status_code == 201
    primary_ticket = resp1.json()["data"]
    primary_id = primary_ticket["id"]
    assert primary_ticket["duplicate_of_id"] is None
    assert primary_ticket["upvote_count"] == 1

    # 2. Second report ~15 meters away (0.0001 degrees lat is ~11.1 meters)
    nearby_lat = base_lat + 0.0001
    data_nearby = {
        "description": "Severe water leakage right outside the market entrance gate.",
        "latitude": str(nearby_lat),
        "longitude": str(base_lon),
        "address_label": "Market Gate 1 Opposite",
        "category_hint": "WATER_LEAK",
    }
    resp2 = await client.post("/api/v1/grievances", data=data_nearby)
    assert resp2.status_code == 201
    nearby_ticket = resp2.json()["data"]

    assert nearby_ticket["duplicate_of_id"] == primary_id

    # Verify primary ticket upvote_count is now 2
    detail_resp = await client.get(f"/api/v1/grievances/{primary_id}")
    assert detail_resp.status_code == 200
    assert detail_resp.json()["data"]["upvote_count"] == 2

    # 3. Third report 500+ meters away (0.006 degrees lat is ~666 meters)
    far_lat = base_lat + 0.006
    data_far = {
        "description": "Water leak from pipe near school campus.",
        "latitude": str(far_lat),
        "longitude": str(base_lon),
        "address_label": "School Road, Sector 19",
        "category_hint": "WATER_LEAK",
    }
    resp3 = await client.post("/api/v1/grievances", data=data_far)
    assert resp3.status_code == 201
    far_ticket = resp3.json()["data"]

    assert far_ticket["duplicate_of_id"] is None
    assert far_ticket["upvote_count"] == 1


@pytest.mark.asyncio
async def test_officer_resolution_and_public_dashboard(
    client: httpx.AsyncClient,
    officer_token: str,
) -> None:
    """Verify officer can resolve a ticket and the public dashboard updates live metrics."""
    # 1. Create a ticket
    data = {
        "description": "Exposed electric wire sparking on sidewalk.",
        "latitude": "28.6200",
        "longitude": "77.2100",
        "address_label": "Central Avenue",
        "category_hint": "ELECTRICAL",
    }
    create_resp = await client.post("/api/v1/grievances", data=data)
    assert create_resp.status_code == 201
    ticket_id = create_resp.json()["data"]["id"]

    # 2. Officer resolves ticket with PATCH
    headers = {"Authorization": f"Bearer {officer_token}"}
    patch_payload = {
        "status": "RESOLVED",
        "remarks": "Wire repaired and insulated by field electrical crew.",
    }
    patch_resp = await client.patch(
        f"/api/v1/grievances/{ticket_id}/status",
        json=patch_payload,
        headers=headers,
    )
    assert patch_resp.status_code == 200, patch_resp.text
    updated = patch_resp.json()["data"]
    assert updated["status"] == "RESOLVED"
    assert updated["resolved_at"] is not None
    assert len(updated["timeline"]) >= 2

    # 3. Public dashboard reflects resolution
    dash_resp = await client.get("/api/v1/grievances/public-dashboard")
    assert dash_resp.status_code == 200
    dash_data = dash_resp.json()["data"]

    assert dash_data["kpi"]["total_tickets"] >= 1
    assert dash_data["kpi"]["resolved_tickets"] >= 1
    assert dash_data["kpi"]["compliance_rate_pct"] >= 0.0
    assert len(dash_data["department_scorecards"]) >= 1
    assert any(m["ticket_id"] == ticket_id for m in dash_data["markers"])
