"""Unit and integration tests for Pillar 1 — Policy Explainer domain."""

from __future__ import annotations

import uuid

import fitz
import httpx
import pytest

from app.domains.policy_explainer.ingestion_parser import extract_clauses_from_pdf
from app.domains.policy_explainer.voice_synthesizer import synthesize_regional_explainer_audio


def _create_sample_pdf(title: str, income_limit_str: str) -> bytes:
    """Create in-memory PDF bytes containing official notification text."""
    doc = fitz.open()
    page = doc.new_page()
    text = (
        f"{title}\n\n"
        f"Official Gazette Notification No. 428-B/2026.\n\n"
        f"Section 2.1 — Income Ceiling: Candidates and families with annual family income "
        f"not exceeding {income_limit_str} are eligible for 100% financial allowance.\n\n"
        f"Clause 3.2 — Enterprise Subsidies: Registered MSME units receive 30% capital subsidy.\n\n"
        f"Clause 4.3 — Territorial Jurisdiction: Open to permanent residents of Madhya Pradesh.\n"
    )
    page.insert_text((50, 72), text)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def test_pdf_clause_extraction() -> None:
    """Verify PDF extraction and clause regex chunking."""
    pdf_bytes = _create_sample_pdf("Yuva Swarojgar Yojana 2026", "INR 3,00,000")
    raw_text, clauses = extract_clauses_from_pdf(pdf_bytes)

    assert "Yuva Swarojgar Yojana" in raw_text
    assert len(clauses) >= 1
    assert any("Section" in c.get("clause_label", "") for c in clauses)


@pytest.mark.asyncio
async def test_voice_synthesizer_regional() -> None:
    """Verify regional voice synthesizer returns valid audio URL and duration."""
    explainer_id = str(uuid.uuid4())
    hi_url, hi_dur = await synthesize_regional_explainer_audio(
        text_script="आप इस योजना के लिए पूरी तरह पात्र हैं।",
        language_code="hi-IN",
        explainer_id=explainer_id,
    )
    assert hi_url.endswith(".mp3")
    assert hi_dur >= 3

    ta_url, ta_dur = await synthesize_regional_explainer_audio(
        text_script="இந்தத் திட்டத்திற்கு நீங்கள் தகுதியுடையவர்.",
        language_code="ta-IN",
        explainer_id=explainer_id,
    )
    assert ta_url.endswith(".mp3")
    assert ta_dur >= 3


@pytest.mark.asyncio
async def test_policy_upload_and_listing(client: httpx.AsyncClient) -> None:
    """Verify POST /api/v1/policies and GET /api/v1/policies."""
    ref_code = f"TEST-POL-{uuid.uuid4().hex[:6].upper()}"
    pdf_bytes = _create_sample_pdf("Test Digital Mission 2026", "INR 4,00,000")

    files = {"file": (f"{ref_code}.pdf", pdf_bytes, "application/pdf")}
    data = {
        "title": "Test Digital Mission 2026",
        "reference_code": ref_code,
        "doc_type": "WELFARE_SCHEME",
        "issuing_body": "Department of Electronics & IT",
        "target_group": "CITIZEN",
    }

    resp = await client.post("/api/v1/policies", data=data, files=files)
    assert resp.status_code == 201
    body = resp.json()
    assert body["data"]["reference_code"] == ref_code
    policy_id = body["data"]["id"]

    # Test listing policies
    list_resp = await client.get("/api/v1/policies", params={"search": ref_code})
    assert list_resp.status_code == 200
    list_body = list_resp.json()
    assert len(list_body["data"]) >= 1
    assert list_body["data"][0]["reference_code"] == ref_code

    # Test get policy detail
    detail_resp = await client.get(f"/api/v1/policies/{policy_id}")
    assert detail_resp.status_code == 200
    assert detail_resp.json()["data"]["id"] == policy_id


@pytest.mark.asyncio
async def test_policy_eligibility_evaluation_eligible(client: httpx.AsyncClient) -> None:
    """Verify eligible profile evaluation and Hindi voice explainer."""
    ref_code = f"TEST-ELIG-{uuid.uuid4().hex[:6].upper()}"
    pdf_bytes = _create_sample_pdf("Kalyan Scheme 2026", "INR 3,00,000")

    files = {"file": (f"{ref_code}.pdf", pdf_bytes, "application/pdf")}
    data = {
        "title": "Kalyan Scheme 2026",
        "reference_code": ref_code,
        "doc_type": "WELFARE_SCHEME",
        "issuing_body": "Social Welfare Department",
        "target_group": "CITIZEN",
    }

    create_resp = await client.post("/api/v1/policies", data=data, files=files)
    assert create_resp.status_code == 201
    policy_id = create_resp.json()["data"]["id"]

    explain_payload = {
        "language_code": "hi-IN",
        "persona_type": "CITIZEN",
        "custom_profile_override": {
            "annual_income": 180000,
            "state": "Madhya Pradesh",
            "is_msme": False,
        },
    }

    resp = await client.post(f"/api/v1/policies/{policy_id}/explain", json=explain_payload)
    assert resp.status_code == 201
    result = resp.json()["data"]

    assert result["eligibility_status"] == "ELIGIBLE"
    assert result["language_code"] == "hi-IN"
    assert "पात्र" in result["plain_language_summary"]
    assert result["audio_explainer_url"].endswith(".mp3")
    assert len(result["rights_and_benefits"]) >= 1


@pytest.mark.asyncio
async def test_policy_eligibility_evaluation_ineligible(client: httpx.AsyncClient) -> None:
    """Verify ineligible profile evaluation and Tamil voice explainer."""
    ref_code = f"TEST-INELIG-{uuid.uuid4().hex[:6].upper()}"
    pdf_bytes = _create_sample_pdf("Subsidy Scheme 2026", "INR 3,00,000")

    files = {"file": (f"{ref_code}.pdf", pdf_bytes, "application/pdf")}
    data = {
        "title": "Subsidy Scheme 2026",
        "reference_code": ref_code,
        "doc_type": "WELFARE_SCHEME",
        "issuing_body": "Finance Ministry",
        "target_group": "CITIZEN",
    }

    create_resp = await client.post("/api/v1/policies", data=data, files=files)
    assert create_resp.status_code == 201
    policy_id = create_resp.json()["data"]["id"]

    explain_payload = {
        "language_code": "ta-IN",
        "persona_type": "CITIZEN",
        "custom_profile_override": {
            "annual_income": 950000,
            "state": "Madhya Pradesh",
            "is_msme": False,
        },
    }

    resp = await client.post(f"/api/v1/policies/{policy_id}/explain", json=explain_payload)
    assert resp.status_code == 201
    result = resp.json()["data"]

    assert result["eligibility_status"] == "INELIGIBLE"
    assert result["language_code"] == "ta-IN"
    assert result["audio_explainer_url"].endswith(".mp3")
    # Verify that the income rule failed
    income_rule = next(r for r in result["eligibility_evaluation"] if "income" in r["rule"].lower())
    assert income_rule["passed"] is False
