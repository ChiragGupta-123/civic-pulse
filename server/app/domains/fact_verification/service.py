"""Service layer for Fact-Verification & Deepfake Audit domain."""

from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException
from app.core.pagination import PaginatedMeta, PaginationParams
from app.core.storage import storage_service
from app.domains.fact_verification.c2pa_inspector import inspect_c2pa_provenance
from app.domains.fact_verification.media_forensics import analyze_media_authenticity
from app.domains.fact_verification.models import (
    ClaimSubmission,
    ForensicAuditResult,
    TrustedFactRecord,
)
from app.domains.fact_verification.registry_verifier import (
    query_veritier_api,
    search_internal_registries,
)
from app.domains.fact_verification.schemas import (
    ClaimAuditDetailDto,
    EvidenceCitationDto,
    ForensicAuditResultDto,
    ProvenanceNodeDto,
    TrustedFactRecordCreateRequest,
    TrustedFactRecordDto,
)
from app.domains.policy_explainer.ingestion_parser import compute_text_embedding

logger = logging.getLogger(__name__)


def _audit_result_to_dto(result: ForensicAuditResult) -> ForensicAuditResultDto:
    """Map ForensicAuditResult ORM model to ForensicAuditResultDto."""
    citations = [
        EvidenceCitationDto(**c) if isinstance(c, dict) else c
        for c in (result.evidence_citations or [])
    ]
    nodes = [
        ProvenanceNodeDto(
            node_id=n.get("node_id", "N"),
            step_name=n.get("step_name", "STEP"),
            detail=n.get("detail", ""),
            timestamp=datetime.fromisoformat(n["timestamp"]) if isinstance(n.get("timestamp"), str) else n.get("timestamp", datetime.now(UTC)),
        )
        for n in (result.provenance_nodes or [])
    ]
    return ForensicAuditResultDto(
        id=result.id,
        claim_id=result.claim_id,
        verdict=result.verdict,
        confidence_score=result.confidence_score,
        credibility_rating=result.credibility_rating,
        c2pa_status=result.c2pa_status,
        c2pa_issuer=result.c2pa_issuer,
        is_deepfake_suspected=result.is_deepfake_suspected,
        synthetic_probability=result.synthetic_probability,
        ela_heatmap_url=result.ela_heatmap_url,
        technical_findings=result.technical_findings or [],
        evidence_citations=citations,
        provenance_nodes=nodes,
        explanation_summary=result.explanation_summary,
        created_at=result.created_at,
    )


def _claim_to_dto(claim: ClaimSubmission, audit: ForensicAuditResult | None = None) -> ClaimAuditDetailDto:
    """Map ClaimSubmission and child audit to ClaimAuditDetailDto."""
    audit_dto = _audit_result_to_dto(audit) if audit else None
    return ClaimAuditDetailDto(
        id=claim.id,
        claim_text=claim.claim_text,
        source_url=claim.source_url,
        media_type=claim.media_type,
        media_url=claim.media_url,
        media_sha256=claim.media_sha256,
        media_phash=claim.media_phash,
        status=claim.status,
        created_at=claim.created_at,
        audit_result=audit_dto,
    )


class FactVerificationService:
    """Executes multimodal verification, ELA heatmaps, C2PA checks, and truth cross-examination."""

    async def audit_claim(
        self,
        db: AsyncSession,
        *,
        claim_text: str,
        source_url: str | None = None,
        media_bytes: bytes | None = None,
        media_filename: str | None = None,
        media_content_type: str | None = None,
        submitted_by: uuid.UUID | None = None,
    ) -> ClaimAuditDetailDto:
        """Run full forensic pipeline and persist verification audit record."""
        claim_id = uuid.uuid4()
        now = datetime.now(UTC)

        # 1. Upload original media if present
        media_url: str | None = None
        if media_bytes:
            filename = media_filename or f"{claim_id}.bin"
            media_url = await storage_service.upload_bytes(
                data=media_bytes,
                folder="forensics/uploads",
                filename=filename,
                content_type=media_content_type or "application/octet-stream",
            )

        # 2. C2PA provenance check
        c2pa_res = inspect_c2pa_provenance(media_bytes, media_filename)

        # 3. Media forensics and ELA heatmap
        forensic_res = await analyze_media_authenticity(
            media_bytes=media_bytes,
            filename=media_filename,
            content_type=media_content_type,
            claim_id=str(claim_id),
        )

        # 4. Cross-examination against Veritier API and internal pgvector registries
        internal_citations = await search_internal_registries(db, claim_text, top_k=3)
        veritier_citations = await query_veritier_api(claim_text)

        all_citations = internal_citations + veritier_citations
        all_citations.sort(key=lambda c: c.get("similarity_score", 0.0), reverse=True)

        # 5. Synthesize verdict
        is_deepfake = forensic_res["is_deepfake_suspected"]
        is_tampered_c2pa = c2pa_res["c2pa_status"] == "MANIFEST_TAMPERED"

        if is_deepfake or is_tampered_c2pa:
            verdict = "SYNTHETIC_OR_MANIPULATED"
            credibility_rating = 10
            confidence_score = 96
            explanation = (
                "Forensic analysis detected Error Level Analysis (ELA) compression anomalies "
                "or cryptographic C2PA signature tampering. Media is synthetic or manipulated."
            )
        elif all_citations and all_citations[0]["similarity_score"] >= 0.70:
            top_cit = all_citations[0]
            claim_lower = claim_text.lower()
            refutation_keywords = [
                "scam", "fake", "cancelled", "hoax", "closed", "abolished",
                "free cash", "guaranteed lakh", "free iphone", "discontinued",
            ]
            if any(rw in claim_lower for rw in refutation_keywords) and not any(rw in top_cit["claim_rebuttal_or_fact"].lower() for rw in refutation_keywords):
                verdict = "FALSE_CLAIM"
                credibility_rating = 15
                confidence_score = 92
                explanation = (
                    f"Official registry record ({top_cit['source_title']}) refutes this claim. "
                    f"Authority finding: {top_cit['claim_rebuttal_or_fact']}"
                )
            else:
                verdict = "VERIFIED_TRUE"
                credibility_rating = 95
                confidence_score = 92
                explanation = (
                    f"Verified authentic. Confirmed by official gazette/registry ({top_cit['source_title']}): "
                    f"{top_cit['claim_rebuttal_or_fact']}"
                )
        elif all_citations and all_citations[0]["similarity_score"] >= 0.45:
            verdict = "MISLEADING"
            credibility_rating = 45
            confidence_score = 75
            explanation = (
                f"Claim contains partially accurate elements but misinterprets statutory criteria. "
                f"Reference: {all_citations[0]['source_title']}."
            )
        else:
            verdict = "UNVERIFIED"
            credibility_rating = 50
            confidence_score = 60
            explanation = "No matching official gazette circular or IFCN-accredited verification found for this claim."

        # 6. Construct provenance audit nodes
        provenance_nodes = [
            {
                "node_id": "N1",
                "step_name": "CLAIM_INGESTION",
                "detail": f"Claim ingested. Media SHA-256: {forensic_res['sha256'] or 'N/A'}",
                "timestamp": now.isoformat(),
            },
            {
                "node_id": "N2",
                "step_name": "C2PA_PROVENANCE_CHECK",
                "detail": f"Content Credentials audit: {c2pa_res['c2pa_status']}",
                "timestamp": now.isoformat(),
            },
            {
                "node_id": "N3",
                "step_name": "ERROR_LEVEL_ANALYSIS",
                "detail": f"ELA Heatmap rendered. Synthetic deepfake probability: {round(forensic_res['synthetic_probability'] * 100, 1)}%",
                "timestamp": now.isoformat(),
            },
            {
                "node_id": "N4",
                "step_name": "REGISTRY_CROSS_EXAMINATION",
                "detail": f"Cross-examined {len(all_citations)} evidence records across Veritier & pgvector registries",
                "timestamp": now.isoformat(),
            },
            {
                "node_id": "N5",
                "step_name": "VERDICT_SYNTHESIS",
                "detail": f"Synthesized verdict {verdict} with credibility score {credibility_rating}/100",
                "timestamp": now.isoformat(),
            },
        ]

        # 7. Persist records
        claim = ClaimSubmission(
            id=claim_id,
            submitted_by=submitted_by,
            claim_text=claim_text,
            source_url=source_url,
            media_type=forensic_res["media_type"],
            media_url=media_url,
            media_sha256=forensic_res["sha256"],
            media_phash=forensic_res["phash"],
            status="COMPLETED",
        )
        db.add(claim)
        await db.flush()

        audit = ForensicAuditResult(
            id=uuid.uuid4(),
            claim_id=claim.id,
            verdict=verdict,
            confidence_score=confidence_score,
            credibility_rating=credibility_rating,
            c2pa_status=c2pa_res["c2pa_status"],
            c2pa_issuer=c2pa_res["c2pa_issuer"],
            is_deepfake_suspected=forensic_res["is_deepfake_suspected"],
            synthetic_probability=forensic_res["synthetic_probability"],
            ela_heatmap_url=forensic_res["ela_heatmap_url"],
            technical_findings=[*c2pa_res["findings"], *forensic_res["technical_findings"]],
            evidence_citations=all_citations,
            provenance_nodes=provenance_nodes,
            explanation_summary=explanation,
        )
        db.add(audit)
        await db.commit()
        await db.refresh(claim)

        return _claim_to_dto(claim, audit)

    async def get_audit_by_id(self, db: AsyncSession, claim_id: uuid.UUID) -> ClaimAuditDetailDto:
        """Fetch audit result and claim submission by claim ID."""
        claim_stmt = select(ClaimSubmission).where(ClaimSubmission.id == claim_id)
        claim_res = await db.execute(claim_stmt)
        claim = claim_res.scalar_one_or_none()
        if not claim:
            raise NotFoundException("Claim submission not found.")

        audit_stmt = select(ForensicAuditResult).where(ForensicAuditResult.claim_id == claim_id)
        audit_res = await db.execute(audit_stmt)
        audit = audit_res.scalar_one_or_none()

        return _claim_to_dto(claim, audit)

    async def list_audits(
        self,
        db: AsyncSession,
        params: PaginationParams,
    ) -> tuple[list[ClaimAuditDetailDto], PaginatedMeta]:
        """Paginated list of verified claims for public transparency feed."""
        count_stmt = select(func.count(ClaimSubmission.id))
        total_items = (await db.execute(count_stmt)).scalar() or 0

        stmt = (
            select(ClaimSubmission)
            .order_by(ClaimSubmission.created_at.desc())
            .offset(params.offset)
            .limit(params.limit)
        )
        claims = (await db.execute(stmt)).scalars().all()

        claim_ids = [c.id for c in claims]
        audit_map = {}
        if claim_ids:
            audits_stmt = select(ForensicAuditResult).where(ForensicAuditResult.claim_id.in_(claim_ids))
            for a in (await db.execute(audits_stmt)).scalars().all():
                audit_map[a.claim_id] = a

        dtos = [_claim_to_dto(c, audit_map.get(c.id)) for c in claims]
        meta = PaginatedMeta.build(page=params.page, page_size=params.page_size, total_items=total_items)
        return dtos, meta

    async def create_trusted_fact(
        self,
        db: AsyncSession,
        payload: TrustedFactRecordCreateRequest,
    ) -> TrustedFactRecordDto:
        """Register a new official civic fact with a 1536-dim normalized vector."""
        embedding = compute_text_embedding(payload.canonical_fact)

        fact = TrustedFactRecord(
            id=uuid.uuid4(),
            reference_code=payload.reference_code,
            canonical_fact=payload.canonical_fact,
            authority_name=payload.authority_name,
            source_url=payload.source_url,
            knowledge_triples=payload.knowledge_triples,
            embedding=embedding,
            effective_date=payload.effective_date,
        )
        db.add(fact)
        await db.commit()
        await db.refresh(fact)

        return TrustedFactRecordDto.model_validate(fact)


fact_verification_service = FactVerificationService()
