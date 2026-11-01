"""Idempotently seed verified government registry facts for Civic Pulse.

Seeds six official facts into ``trusted_fact_records`` with normalized
1536-dimensional embeddings for pgvector semantic search.

Run from repository root or server/ directory:
    python infra/seeds/seed_verification_registry.py
"""

from __future__ import annotations

import asyncio
import datetime
import hashlib
import math
import sys
from pathlib import Path

# Make ``app`` importable regardless of current working directory
_REPO_ROOT = Path(__file__).resolve().parents[2]
_SERVER_DIR = _REPO_ROOT / "server"
if str(_SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(_SERVER_DIR))

from sqlalchemy import select  # noqa: E402
from sqlalchemy.ext.asyncio import AsyncSession  # noqa: E402

from app.core.database import AsyncSessionLocal, engine  # noqa: E402
from app.domains.fact_verification.models import TrustedFactRecord  # noqa: E402


def compute_deterministic_embedding(text: str, dim: int = 1536) -> list[float]:
    """Generate a deterministic, normalized unit vector of dimension `dim` from `text`."""
    vec = [0.0] * dim
    clean_text = text.lower().strip()
    words = clean_text.split()
    if not words:
        words = ["empty"]

    for word in words:
        h = hashlib.sha256(word.encode("utf-8")).digest()
        for i in range(0, len(h) - 1, 2):
            idx = ((h[i] << 8) | h[i + 1]) % dim
            val = ((h[i] ^ h[i + 1]) - 128) / 128.0
            vec[idx] += val

    for n in range(2, 5):
        for i in range(len(clean_text) - n + 1):
            gram = clean_text[i : i + n]
            gh = hashlib.md5(gram.encode("utf-8")).digest()
            idx = ((gh[0] << 8) | gh[1]) % dim
            vec[idx] += (gh[2] - 128) / 256.0

    norm = math.sqrt(sum(v * v for v in vec))
    if norm > 0:
        return [v / norm for v in vec]
    vec[0] = 1.0
    return vec


VERIFIED_FACTS: list[dict] = [
    {
        "reference_code": "GOV-FACT-RATION-2026",
        "canonical_fact": (
            "Public Ration Card distribution and food grain subsidies under NFSA "
            "continue uninterrupted through FY 2026-27 across all fair price shops."
        ),
        "authority_name": "Ministry of Consumer Affairs, Food & Public Distribution",
        "source_url": "https://dfpd.gov.in/notification-nfsa-fy2026-27",
        "knowledge_triples": [
            {"subject": "Ration Card", "predicate": "status", "object": "continues normally"},
            {"subject": "Subsidized Food Grains", "predicate": "validity", "object": "FY 2026-27"},
        ],
        "effective_date": datetime.date(2026, 4, 1),
    },
    {
        "reference_code": "GOV-FACT-WATER-2026",
        "canonical_fact": (
            "Municipal domestic water tariff remains unchanged at INR 8 per kilolitre "
            "for residential connections under 15,000 litres monthly consumption."
        ),
        "authority_name": "Municipal Water Board",
        "source_url": "https://waterboard.gov.in/tariffs/2026",
        "knowledge_triples": [
            {"subject": "Municipal Water Tariff", "predicate": "rate", "object": "INR 8/kL"},
            {"subject": "Rate Change", "predicate": "status", "object": "unchanged"},
        ],
        "effective_date": datetime.date(2026, 1, 1),
    },
    {
        "reference_code": "GOV-FACT-SOLAR-2026",
        "canonical_fact": (
            "PM-Surya Ghar Muft Bijli Yojana provides up to 40% capital subsidy "
            "for residential rooftop solar systems up to 3 kW capacity."
        ),
        "authority_name": "Ministry of New and Renewable Energy",
        "source_url": "https://pmsuryaghar.gov.in/guidelines-2026",
        "knowledge_triples": [
            {"subject": "PM-Surya Ghar", "predicate": "capital subsidy", "object": "40%"},
            {"subject": "Capacity Limit", "predicate": "max", "object": "3 kW"},
        ],
        "effective_date": datetime.date(2026, 2, 15),
    },
    {
        "reference_code": "GOV-FACT-MSME-2026",
        "canonical_fact": (
            "Collateral-free credit guarantee for registered micro enterprises is extended "
            "up to INR 5 Lakh under the revised MSME Credit Support Scheme."
        ),
        "authority_name": "Ministry of Micro, Small and Medium Enterprises",
        "source_url": "https://msme.gov.in/schemes/credit-guarantee-2026",
        "knowledge_triples": [
            {"subject": "MSME Credit", "predicate": "collateral requirement", "object": "collateral-free"},
            {"subject": "Credit Limit", "predicate": "amount", "object": "INR 5 Lakh"},
        ],
        "effective_date": datetime.date(2026, 1, 10),
    },
    {
        "reference_code": "GOV-FACT-SCHOLARSHIP-2026",
        "canonical_fact": (
            "Post-Matric Scholarship renewal deadline for state and national portals "
            "is officially extended to December 31, 2026."
        ),
        "authority_name": "Department of Higher Education & Social Justice",
        "source_url": "https://scholarships.gov.in/deadlines-2026",
        "knowledge_triples": [
            {"subject": "Post-Matric Scholarship", "predicate": "renewal deadline", "object": "December 31, 2026"},
            {"subject": "Status", "predicate": "action", "object": "extended"},
        ],
        "effective_date": datetime.date(2026, 8, 1),
    },
    {
        "reference_code": "GOV-FACT-BRIDGE-2026",
        "canonical_fact": (
            "NH-46 overpass bridge repair and lane resurfacing schedule is underway from "
            "March 1 to May 15, 2026 with designated traffic diversions."
        ),
        "authority_name": "National Highways Authority of India & PWD",
        "source_url": "https://nhai.gov.in/traffic-advisory-nh46-2026",
        "knowledge_triples": [
            {"subject": "NH-46 Bridge", "predicate": "repair schedule", "object": "March 1 to May 15, 2026"},
            {"subject": "Traffic", "predicate": "management", "object": "diversions active"},
        ],
        "effective_date": datetime.date(2026, 3, 1),
    },
]


async def seed_verification_registry(session: AsyncSession) -> int:
    """Seed the 6 verified government registry facts idempotently."""
    created = 0
    for fact in VERIFIED_FACTS:
        stmt = select(TrustedFactRecord).where(
            TrustedFactRecord.reference_code == fact["reference_code"]
        )
        existing = (await session.execute(stmt)).scalar_one_or_none()
        embedding = compute_deterministic_embedding(fact["canonical_fact"])

        if existing is None:
            record = TrustedFactRecord(
                reference_code=fact["reference_code"],
                canonical_fact=fact["canonical_fact"],
                authority_name=fact["authority_name"],
                source_url=fact["source_url"],
                knowledge_triples=fact["knowledge_triples"],
                embedding=embedding,
                effective_date=fact["effective_date"],
            )
            session.add(record)
            created += 1
        else:
            existing.canonical_fact = fact["canonical_fact"]
            existing.authority_name = fact["authority_name"]
            existing.source_url = fact["source_url"]
            existing.knowledge_triples = fact["knowledge_triples"]
            existing.embedding = embedding
            existing.effective_date = fact["effective_date"]

    await session.commit()
    return created


async def main() -> None:
    async with AsyncSessionLocal() as session:
        created = await seed_verification_registry(session)
        print(f"Successfully seeded {created} new verified registry facts (reconciled total: {len(VERIFIED_FACTS)}).")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())

