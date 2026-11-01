"""Full-System E2E Workflow Test across all Civic Pulse Pillars.

Validates the full citizen and officer lifecycle:
1. Identity & Encrypted Citizen Vault (AES-256-GCM)
2. Pillar 1: Multilingual Policy Gazette Ingestion & Persona Explainer (AI4Bharat)
3. Pillar 2: Civic Grievance Intake, 50m PostGIS Spatial Dedup, & Public Dashboard
4. Pillar 3: Supervised Autonomous Bureaucracy Agent with HITL OTP Relay
5. Pillar 4: Multimodal Claim Fact-Verification, ELA Forensics, & Veritier API
"""

from __future__ import annotations

import io
import uuid

import fitz
import httpx
import pytest
from PIL import Image

from app.core.database import AsyncSessionLocal
from app.core.security import create_access_token
from app.domains.identity.models import User


def _create_sample_pdf(title: str) -> bytes:
    """Create in-memory PDF bytes containing official notification text."""
    doc = fitz.open()
    page = doc.new_page()
    text = (
        f"{title}\n\n"
        f"Official Gazette Notification No. EDU-2026-X.\n\n"
        f"Section 1.1 — Eligibility: Students with annual family income below INR 3,00,000 "
        f"are entitled to a full educational stipend.\n\n"
        f"Clause 2.1 — Rights: Direct monthly bank disbursement.\n"
    )
    page.insert_text((50, 72), text)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def _create_sample_jpeg() -> bytes:
    """Create a sample JPEG image in memory for forensic/grievance tests."""
    img = Image.new("RGB", (180, 180), color=(220, 100, 60))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return buf.getvalue()


@pytest.fixture
async def officer_auth_headers() -> dict[str, str]:
    """Return authorization header for an officer."""
    async with AsyncSessionLocal() as session:
        officer = User(
            id=uuid.uuid4(),
            email=f"e2e.officer.{uuid.uuid4().hex[:6]}@civicpulse.gov.in",
            password_hash="test",
            full_name="E2E Senior Municipal Officer",
            role="OFFICER",
            preferred_language="en-IN",
        )
        session.add(officer)
        await session.commit()
        token = create_access_token(str(officer.id), officer.role)
        return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_full_civic_pulse_e2e_journey(
    client: httpx.AsyncClient,
    officer_auth_headers: dict[str, str],
) -> None:
    """Execute complete end-to-end journey across all 4 pillars and public accountability."""
    unique_suffix = uuid.uuid4().hex[:8]

    # =========================================================================
    # STEP 1: Citizen Registration & Encrypted Vault Management
    # =========================================================================
    citizen_email = f"citizen.{unique_suffix}@example.com"
    reg_resp = await client.post(
        "/api/v1/auth/register",
        json={
            "email": citizen_email,
            "password": "Password123!",
            "full_name": "Rajesh Kumar",
            "role": "CITIZEN",
            "preferred_language": "hi-IN",
        },
    )
    assert reg_resp.status_code == 201, reg_resp.text
    reg_data = reg_resp.json()["data"]
    citizen_token = reg_data["access_token"]
    citizen_headers = {"Authorization": f"Bearer {citizen_token}"}

    # Upsert Citizen Vault with AES-256-GCM encryption
    vault_payload = {
        "pii_secret": {
            "national_id": "9988-7766-5544",
            "dob": "1996-05-20",
            "bank_iban": "SBIN000554433",
            "phone_number": "+919876543210",
            "portal_pin": "654321",
        },
        "public_profile": {
            "state": "Delhi",
            "annual_income": 220000,
            "occupation": "Post-Graduate Scholar",
            "category": "OBC",
            "is_msme": False,
            "education_level": "Post-Graduate",
        },
        "document_urls": [],
    }
    vault_put_resp = await client.put(
        "/api/v1/vault",
        json=vault_payload,
        headers=citizen_headers,
    )
    assert vault_put_resp.status_code == 200, vault_put_resp.text
    vault_data = vault_put_resp.json()["data"]
    assert vault_data["pii_secret"]["national_id"] == "9988-7766-5544"
    assert vault_data["public_profile"]["annual_income"] == 220000

    # =========================================================================
    # STEP 2: Pillar 1 — Multilingual Policy Explainer
    # =========================================================================
    # Upload Policy Gazette
    policy_title = f"Higher Education Fellowship Scheme {unique_suffix}"
    sample_pdf = _create_sample_pdf(policy_title)
    policy_files = {
        "file": ("higher_ed_scheme.pdf", sample_pdf, "application/pdf"),
    }
    policy_data = {
        "title": policy_title,
        "reference_code": f"GAZ-EDU-{unique_suffix.upper()}",
        "doc_type": "WELFARE_SCHEME",
        "issuing_body": "Department of Higher Education",
        "target_group": "CITIZEN",
    }
    policy_upload_resp = await client.post(
        "/api/v1/policies",
        data=policy_data,
        files=policy_files,
        headers=officer_auth_headers,
    )
    assert policy_upload_resp.status_code in (200, 201), policy_upload_resp.text
    policy_id = policy_upload_resp.json()["data"]["id"]

    # Request personalized explainer in Hindi
    explain_resp = await client.post(
        f"/api/v1/policies/{policy_id}/explain",
        json={
            "language_code": "hi-IN",
            "persona_type": "CITIZEN",
            "citizen_profile": {
                "annual_income": 220000,
                "occupation": "Scholar",
                "state": "Delhi",
                "category": "OBC",
            },
        },
        headers=citizen_headers,
    )
    assert explain_resp.status_code in (200, 201), explain_resp.text
    explainer = explain_resp.json()["data"]
    assert explainer["language_code"] == "hi-IN"
    assert explainer["eligibility_status"] in ("ELIGIBLE", "PARTIAL_MATCH", "INELIGIBLE")
    assert len(explainer["plain_language_summary"]) > 0

    # =========================================================================
    # STEP 3: Pillar 2 — Civic Grievance Triage, 50m Dedup, & Public Dashboard
    # =========================================================================
    base_lat = 28.6139 + (uuid.uuid4().int % 500) * 0.0001
    base_lng = 77.2090 + (uuid.uuid4().int % 500) * 0.0001

    sample_img = _create_sample_jpeg()

    # Grievance 1: Initial report
    g1_resp = await client.post(
        "/api/v1/grievances",
        data={
            "category": "ROAD_BRIDGE_DAMAGE",
            "description": "Hazardous road pothole with exposed structural rebar near intersection",
            "latitude": str(base_lat),
            "longitude": str(base_lng),
            "address_label": "Main Ring Road Sector 14",
        },
        files={"media_file": ("pothole.jpg", sample_img, "image/jpeg")},
        headers=citizen_headers,
    )
    assert g1_resp.status_code in (200, 201), g1_resp.text
    g1_ticket = g1_resp.json()["data"]
    ticket_1_id = g1_ticket["id"]
    assert g1_ticket["upvote_count"] == 1
    assert g1_ticket["status"] == "TRIAGED"

    # Grievance 2: Second report within 25 meters (approx 0.0002 deg offset)
    g2_resp = await client.post(
        "/api/v1/grievances",
        data={
            "category": "ROAD_BRIDGE_DAMAGE",
            "description": "Deep asphalt trench causing vehicular accidents",
            "latitude": str(base_lat + 0.00015),
            "longitude": str(base_lng + 0.00015),
            "address_label": "Ring Road opposite petrol pump",
        },
        headers=citizen_headers,
    )
    assert g2_resp.status_code in (200, 201), g2_resp.text
    g2_ticket = g2_resp.json()["data"]

    # Spatial deduplication links g2 to g1 and increments upvotes on the canonical ticket
    assert g2_ticket["duplicate_of_id"] == ticket_1_id

    g1_check_resp = await client.get(f"/api/v1/grievances/{ticket_1_id}")
    assert g1_check_resp.status_code == 200, g1_check_resp.text
    assert g1_check_resp.json()["data"]["upvote_count"] >= 2

    # Verify Public Accountability Dashboard (Open, No Auth required)
    public_dash_resp = await client.get("/api/v1/grievances/public-dashboard")
    assert public_dash_resp.status_code == 200, public_dash_resp.text
    dash_data = public_dash_resp.json()["data"]
    assert "kpi" in dash_data or "kpis" in dash_data
    kpi_obj = dash_data.get("kpi") or dash_data.get("kpis")
    assert kpi_obj["total_tickets"] >= 1
    assert len(dash_data["department_scorecards"]) >= 1

    # Officer updates ticket status to RESOLVED
    status_update_resp = await client.patch(
        f"/api/v1/grievances/{ticket_1_id}/status",
        json={
            "status": "RESOLVED",
            "remarks": "Pothole filled with rapid-setting asphalt concrete mix.",
        },
        headers=officer_auth_headers,
    )
    assert status_update_resp.status_code == 200, status_update_resp.text
    updated_ticket = status_update_resp.json()["data"]
    assert updated_ticket["status"] == "RESOLVED"

    # =========================================================================
    # STEP 4: Pillar 3 — Autonomous Bureaucracy Agent
    # =========================================================================
    agent_run_resp = await client.post(
        "/api/v1/agent/runs",
        json={
            "service_code": "SCHOLARSHIP_RENEWAL",
            "auto_solve_hitl_otp": "654321",
        },
        headers=citizen_headers,
    )
    assert agent_run_resp.status_code in (200, 201, 202), agent_run_resp.text
    run_info = agent_run_resp.json()["data"]
    run_id = run_info["run_id"]
    assert run_id is not None

    # Retrieve Run detail
    run_detail_resp = await client.get(
        f"/api/v1/agent/runs/{run_id}",
        headers=citizen_headers,
    )
    assert run_detail_resp.status_code == 200, run_detail_resp.text
    run_detail = run_detail_resp.json()["data"]
    assert run_detail["service_code"] == "SCHOLARSHIP_RENEWAL"
    assert run_detail["status"] in ("QUEUED", "RUNNING", "WAITING_FOR_HITL", "COMPLETED")

    # =========================================================================
    # STEP 5: Pillar 4 — Fact-Verification & Deepfake Audit
    # =========================================================================
    audit_resp = await client.post(
        "/api/v1/fact-checks/audit",
        data={
            "claim_text": "Government offers 100% scholarship waiver for OBC students under new gazette scheme",
            "source_url": "https://social-media.example.com/viral-post-1",
        },
        files={"media_file": ("suspicious_doc.jpg", sample_img, "image/jpeg")},
    )
    assert audit_resp.status_code in (200, 201), audit_resp.text
    audit_report = audit_resp.json()["data"]
    audit_res = audit_report.get("audit_result")
    assert audit_res is not None
    assert "verdict" in audit_res
    assert "credibility_rating" in audit_res
    assert audit_res["c2pa_status"] in (
        "MANIFEST_VALID",
        "MANIFEST_TAMPERED",
        "MANIFEST_MISSING",
    )

    # Verify public fact-check feed returns the verified record
    feed_resp = await client.get("/api/v1/fact-checks/feed")
    assert feed_resp.status_code == 200, feed_resp.text
    feed_items = feed_resp.json()["data"]
    assert len(feed_items) >= 1
    assert any(item["id"] == audit_report["id"] for item in feed_items)
