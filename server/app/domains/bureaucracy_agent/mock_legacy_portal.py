"""Mock Legacy E-Governance Portal.

Simulates a traditional state government portal with a multi-step form,
supporting document upload, and a mandatory SMS OTP verification challenge.
"""

from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Form, HTTPException, UploadFile, status
from fastapi.responses import HTMLResponse

logger = logging.getLogger(__name__)

mock_portal_router = APIRouter()

ALLOWED_SERVICES = {"SCHOLARSHIP_RENEWAL", "MSME_LICENSE", "WELFARE_SUBSIDY"}


@mock_portal_router.get("/{service_code}", response_class=HTMLResponse)
async def render_legacy_portal_page(service_code: str) -> HTMLResponse:
    """Render legacy multi-section government application portal."""
    code_upper = service_code.upper()
    if code_upper not in ALLOWED_SERVICES:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service '{service_code}' not supported on legacy portal.",
        )

    service_titles = {
        "SCHOLARSHIP_RENEWAL": "Post-Matric Merit Scholarship Renewal Portal (AY 2026-27)",
        "MSME_LICENSE": "Udyam State Trade & Commercial Enterprise Licensing System",
        "WELFARE_SUBSIDY": "Direct Benefit Transfer Welfare Subsidy Renewal Portal",
    }
    title = service_titles.get(code_upper, code_upper)

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{title} - Govt of India E-Services</title>
  <style>
    body {{
      font-family: "Times New Roman", Times, serif;
      background-color: #f4f1ea;
      margin: 0;
      padding: 20px;
      color: #222;
    }}
    .container {{
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border: 2px solid #003366;
      padding: 24px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }}
    .header {{
      text-align: center;
      border-bottom: 2px solid #003366;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }}
    .header h2 {{
      margin: 4px 0;
      color: #003366;
      text-transform: uppercase;
      font-size: 20px;
    }}
    .header p {{
      margin: 2px 0;
      font-size: 13px;
      color: #555;
    }}
    fieldset {{
      border: 1px solid #777;
      margin-bottom: 18px;
      padding: 14px;
      background: #faf8f5;
    }}
    legend {{
      font-weight: bold;
      color: #003366;
      padding: 0 6px;
    }}
    .form-group {{
      margin-bottom: 12px;
      display: flex;
      flex-direction: column;
    }}
    .form-group label {{
      font-weight: bold;
      font-size: 13px;
      margin-bottom: 4px;
    }}
    .form-group input, .form-group select {{
      padding: 6px 8px;
      border: 1px solid #999;
      font-size: 14px;
      background: #fff;
    }}
    .otp-box {{
      background: #fff9e6;
      border: 1px dashed #d97706;
      padding: 12px;
      margin-top: 10px;
    }}
    .submit-btn {{
      background: #003366;
      color: #ffffff;
      padding: 10px 20px;
      font-size: 15px;
      font-weight: bold;
      border: none;
      cursor: pointer;
      width: 100%;
    }}
    .submit-btn:hover {{
      background: #002244;
    }}
    .required {{
      color: #cc0000;
    }}
  </style>
</head>
<body>
<div class="container">
  <div class="header">
    <div style="font-size: 28px; font-weight: bold; color: #b45309;">सत्यमेव जयते</div>
    <h2>{title}</h2>
    <p>Official Digital Governance Gateway — Government of India e-District Services</p>
  </div>

  <form id="gov_application_form" action="/mock-gov-portal/{code_upper}/submit" method="POST" enctype="multipart/form-data">
    <fieldset>
      <legend>Step 1: Citizen Identity & Demographics</legend>
      <div class="form-group">
        <label for="full_name">Full Legal Name <span class="required">*</span></label>
        <input type="text" id="full_name" name="full_name" required placeholder="e.g. Ramesh Kumar">
      </div>
      <div class="form-group">
        <label for="national_id">National Identity / Aadhaar Number <span class="required">*</span></label>
        <input type="text" id="national_id" name="national_id" required placeholder="12-digit UID">
      </div>
      <div class="form-group">
        <label for="dob">Date of Birth (YYYY-MM-DD) <span class="required">*</span></label>
        <input type="text" id="dob" name="dob" required placeholder="1998-05-15">
      </div>
      <div class="form-group">
        <label for="state">Domicile State <span class="required">*</span></label>
        <input type="text" id="state" name="state" required placeholder="e.g. Madhya Pradesh">
      </div>
      <div class="form-group">
        <label for="category">Social Category <span class="required">*</span></label>
        <input type="text" id="category" name="category" required placeholder="e.g. GENERAL, OBC, SC, ST">
      </div>
    </fieldset>

    <fieldset>
      <legend>Step 2: Financial Demographics & Verification Upload</legend>
      <div class="form-group">
        <label for="annual_income">Certified Annual Family Income (INR) <span class="required">*</span></label>
        <input type="number" id="annual_income" name="annual_income" required placeholder="e.g. 240000">
      </div>
      <div class="form-group">
        <label for="bank_iban">Direct Benefit Transfer (DBT) Bank Account / IBAN <span class="required">*</span></label>
        <input type="text" id="bank_iban" name="bank_iban" required placeholder="e.g. SBIN000123456789">
      </div>
      <div class="form-group">
        <label for="supporting_doc">Income / Domicile Certificate (PDF/Image) <span class="required">*</span></label>
        <input type="file" id="supporting_doc" name="supporting_doc">
      </div>
    </fieldset>

    <fieldset>
      <legend>Step 3: Security Challenge & Declaration</legend>
      <div class="otp-box">
        <div style="font-weight: bold; color: #b45309; margin-bottom: 6px;">
          Mandatory Human Verification: SMS One-Time Password (OTP)
        </div>
        <p style="font-size: 12px; margin: 0 0 8px 0;">
          A 6-digit one-time authorization code has been dispatched to your registered Aadhaar-linked mobile device.
        </p>
        <div class="form-group">
          <label for="otp_input">Enter 6-Digit SMS OTP <span class="required">*</span></label>
          <input type="text" id="otp_input" name="otp_input" maxlength="6" required placeholder="e.g. 482910">
        </div>
      </div>
      <div style="margin-top: 12px; font-size: 13px;">
        <label>
          <input type="checkbox" id="declaration_checkbox" name="declaration_checkbox" required checked>
          I hereby declare that all provided statements are true and accurate under IPC Sec 199.
        </label>
      </div>
    </fieldset>

    <div style="margin-top: 20px;">
      <button type="submit" id="submit_application_btn" class="submit-btn">
        Submit Official Application & Generate Receipt
      </button>
    </div>
  </form>
</div>
</body>
</html>"""
    return HTMLResponse(content=html_content)


@mock_portal_router.post("/{service_code}/submit", response_class=HTMLResponse)
async def submit_legacy_portal_application(
    service_code: str,
    full_name: str = Form(""),
    national_id: str = Form(""),
    dob: str = Form(""),
    state: str = Form(""),
    category: str = Form(""),
    annual_income: str = Form(""),
    bank_iban: str = Form(""),
    otp_input: str = Form(""),
    declaration_checkbox: str | None = Form(None),
    supporting_doc: UploadFile | None = None,
) -> HTMLResponse:
    """Process portal form submission and generate verifiable acknowledgment receipt."""
    code_upper = service_code.upper()
    if code_upper not in ALLOWED_SERVICES:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service '{service_code}' not supported.",
        )

    # Validate 6-digit OTP
    clean_otp = (otp_input or "").strip()
    if len(clean_otp) != 6 or not clean_otp.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP challenge response: must be a 6-digit numeric token.",
        )

    # Generate tracking receipt ID
    short_suffix = uuid.uuid4().hex[:6].upper()
    prefix_map = {
        "SCHOLARSHIP_RENEWAL": "SCHOLARSHIP",
        "MSME_LICENSE": "MSME",
        "WELFARE_SUBSIDY": "WELFARE",
    }
    svc_prefix = prefix_map.get(code_upper, "SERVICE")
    tracking_receipt_id = f"GOV-{svc_prefix}-2026-{short_suffix}"
    submission_timestamp = datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S UTC")

    receipt_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Official Acknowledgment Receipt - {tracking_receipt_id}</title>
  <style>
    body {{
      font-family: "Courier New", Courier, monospace;
      background: #eef2f5;
      padding: 30px;
      color: #111;
    }}
    .receipt-container {{
      max-width: 720px;
      margin: 0 auto;
      background: #fff;
      border: 3px double #003366;
      padding: 30px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }}
    .title-banner {{
      text-align: center;
      border-bottom: 2px dashed #003366;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }}
    .tracking-badge {{
      display: inline-block;
      background: #e0f2fe;
      color: #0369a1;
      border: 2px solid #0284c7;
      padding: 8px 16px;
      font-size: 18px;
      font-weight: bold;
      letter-spacing: 1px;
      margin: 12px 0;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }}
    td, th {{
      border: 1px solid #ccc;
      padding: 8px 12px;
      font-size: 13px;
    }}
    th {{
      background: #f1f5f9;
      text-align: left;
    }}
    .seal {{
      text-align: right;
      margin-top: 24px;
      font-size: 12px;
      color: #555;
    }}
  </style>
</head>
<body>
<div class="receipt-container">
  <div class="title-banner">
    <div style="font-size: 22px; font-weight: bold;">GOVERNMENT OF INDIA</div>
    <div style="font-size: 14px; margin-top: 4px;">DEPARTMENT OF DIGITAL GOVERNANCE & CITIZEN SERVICES</div>
    <div style="font-size: 12px; color: #666;">NATIONAL ELECTRONIC SERVICE DELIVERY GATEWAY</div>
    <div class="tracking-badge" id="tracking_receipt_id">{tracking_receipt_id}</div>
    <div style="font-size: 12px; color: #166534; font-weight: bold;">STATUS: APPLICATION SUBMITTED & VERIFIED</div>
  </div>

  <table>
    <tr><th>Service Title</th><td>{code_upper.replace('_', ' ')}</td></tr>
    <tr><th>Applicant Name</th><td>{full_name or "Ramesh Kumar"}</td></tr>
    <tr><th>National ID / UID</th><td>{national_id or "XXXX-XXXX-9012"}</td></tr>
    <tr><th>Date of Birth</th><td>{dob or "1998-05-15"}</td></tr>
    <tr><th>Domicile State</th><td>{state or "Madhya Pradesh"}</td></tr>
    <tr><th>Category</th><td>{category or "GENERAL"}</td></tr>
    <tr><th>Certified Annual Income</th><td>INR {annual_income or "2,40,000"}</td></tr>
    <tr><th>DBT Bank Account / IBAN</th><td>{bank_iban or "SBIN000123456789"}</td></tr>
    <tr><th>Submission Timestamp</th><td>{submission_timestamp}</td></tr>
  </table>

  <div class="seal">
    <div><strong>Digitally Signed & Validated</strong></div>
    <div>Controller of Electronic Certifications</div>
    <div>Digital Seal Hash: {uuid.uuid4().hex[:16].upper()}</div>
  </div>
</div>
</body>
</html>"""
    return HTMLResponse(content=receipt_html)
