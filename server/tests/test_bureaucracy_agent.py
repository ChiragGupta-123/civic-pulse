"""Tests for Pillar 3 — Autonomous Bureaucracy Agent & Mock Legacy Portal."""

from __future__ import annotations

import asyncio

import httpx
import pytest

from app.domains.bureaucracy_agent.playwright_runner import validate_portal_url


def test_ssrf_guard_blocks_dangerous_urls() -> None:
    """Verify SSRF guard rejects file schemes and cloud metadata IP addresses."""
    # 1. file:// scheme
    with pytest.raises(Exception) as exc1:
        validate_portal_url("file:///etc/passwd")
    assert "scheme must be http or https" in str(exc1.value)

    # 2. Cloud metadata IP
    with pytest.raises(Exception) as exc2:
        validate_portal_url("http://169.254.169.254/latest/meta-data")
    assert "cloud metadata address forbidden" in str(exc2.value)


@pytest.mark.asyncio
async def test_ssrf_endpoint_validation(client: httpx.AsyncClient) -> None:
    """Verify POST /api/v1/agent/runs returns 422 when an illegal portal URL is provided."""
    resp = await client.post(
        "/api/v1/agent/runs",
        json={
            "service_code": "SCHOLARSHIP_RENEWAL",
            "portal_url": "http://169.254.169.254/computeMetadata/v1",
        },
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_mock_legacy_portal_html_rendering(client: httpx.AsyncClient) -> None:
    """Verify mock legacy government portal renders form elements and handles submission."""
    # 1. Render form
    get_resp = await client.get("/mock-gov-portal/SCHOLARSHIP_RENEWAL")
    assert get_resp.status_code == 200
    html = get_resp.text
    assert 'id="gov_application_form"' in html
    assert 'id="full_name"' in html
    assert 'id="national_id"' in html
    assert 'id="otp_input"' in html
    assert 'id="submit_application_btn"' in html

    # 2. Submit form with valid 6-digit OTP
    data = {
        "full_name": "Demo Citizen",
        "national_id": "1234-5678-9012",
        "dob": "1998-05-15",
        "state": "Madhya Pradesh",
        "category": "GENERAL",
        "annual_income": "240000",
        "bank_iban": "SBIN000123456789",
        "otp_input": "482910",
        "declaration_checkbox": "on",
    }
    post_resp = await client.post("/mock-gov-portal/SCHOLARSHIP_RENEWAL/submit", data=data)
    assert post_resp.status_code == 200
    receipt_html = post_resp.text
    assert 'id="tracking_receipt_id"' in receipt_html
    assert "GOV-SCHOLARSHIP-2026-" in receipt_html


@pytest.mark.asyncio
async def test_bureaucracy_agent_full_hitl_workflow(client: httpx.AsyncClient) -> None:
    """Verify full end-to-end agent run: creation, HITL OTP challenge pause, unblock, and completion."""
    # 1. Start execution run
    create_payload = {
        "service_code": "SCHOLARSHIP_RENEWAL",
        "portal_url": "http://testserver/mock-gov-portal/SCHOLARSHIP_RENEWAL",
    }
    create_resp = await client.post("/api/v1/agent/runs", json=create_payload)
    assert create_resp.status_code == 202
    run_data = create_resp.json()["data"]
    run_id = run_data["run_id"]

    # 2. Poll until agent enters WAITING_FOR_HITL state
    waiting_for_hitl = False
    check_resp = None
    for _ in range(30):
        await asyncio.sleep(0.1)
        check_resp = await client.get(f"/api/v1/agent/runs/{run_id}")
        assert check_resp.status_code == 200
        cur_status = check_resp.json()["data"]["status"]
        if cur_status == "WAITING_FOR_HITL":
            waiting_for_hitl = True
            break
    assert waiting_for_hitl and check_resp is not None, "Agent failed to transition to WAITING_FOR_HITL"

    # Verify obstacle info
    status_data = check_resp.json()["data"]
    assert status_data["obstacle_type"] == "OTP"
    assert status_data["prompt_message"] is not None
    assert status_data["obstacle_screenshot_url"] is not None

    # 3. Supply 6-digit SMS OTP via HITL endpoint
    hitl_payload = {
        "obstacle_type": "OTP",
        "user_input": "482910",
    }
    hitl_resp = await client.post(f"/api/v1/agent/runs/{run_id}/hitl", json=hitl_payload)
    assert hitl_resp.status_code == 200

    # 4. Poll until agent finishes (status == COMPLETED)
    completed = False
    final_data: dict = {}
    for _ in range(40):
        await asyncio.sleep(0.1)
        final_check = await client.get(f"/api/v1/agent/runs/{run_id}")
        assert final_check.status_code == 200
        final_data = final_check.json()["data"]
        if final_data["status"] == "COMPLETED":
            completed = True
            break
    assert completed, f"Agent did not complete successfully. Status: {final_data.get('status')}, error: {final_data.get('error_detail')}"

    # Verify tracking receipt and PDF receipt URL
    assert final_data["tracking_receipt_id"].startswith("GOV-SCHOLARSHIP-")
    assert final_data["receipt_pdf_url"].endswith(".pdf")
    assert len(final_data["steps"]) >= 4
    step_actions = [s["action"] for s in final_data["steps"]]
    assert "NAVIGATE" in step_actions
    assert "FILL_FORM" in step_actions
    assert "SOLVE_HITL_OTP" in step_actions
    assert "EXTRACT_RECEIPT" in step_actions


@pytest.mark.asyncio
async def test_bureaucracy_agent_auto_solve_mode(client: httpx.AsyncClient) -> None:
    """Verify agent run with auto_solve_hitl_otp completes without pausing."""
    payload = {
        "service_code": "MSME_LICENSE",
        "portal_url": "http://testserver/mock-gov-portal/MSME_LICENSE",
        "auto_solve_hitl_otp": "998877",
    }
    resp = await client.post("/api/v1/agent/runs", json=payload)
    assert resp.status_code == 202
    run_id = resp.json()["data"]["run_id"]

    completed = False
    check = None
    for _ in range(30):
        await asyncio.sleep(0.1)
        check = await client.get(f"/api/v1/agent/runs/{run_id}")
        if check.json()["data"]["status"] == "COMPLETED":
            completed = True
            break
    assert completed
    assert check is not None
    detail = check.json()["data"]
    assert detail["tracking_receipt_id"].startswith("GOV-MSME-")
