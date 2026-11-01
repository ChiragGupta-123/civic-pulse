"""Policy Explainer domain orchestration service."""

from __future__ import annotations

import logging
import uuid
from typing import Any, cast

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictException, NotFoundException
from app.core.pagination import PaginatedMeta
from app.core.storage import storage_service
from app.domains.identity.service import IdentityService
from app.domains.policy_explainer.ingestion_parser import (
    compute_text_embedding,
    extract_clauses_from_pdf,
)
from app.domains.policy_explainer.models import (
    PolicyClauseChunk,
    PolicyDocument,
    PolicyVoiceExplainer,
)
from app.domains.policy_explainer.rag_explainer import evaluate_policy_eligibility
from app.domains.policy_explainer.schemas import (
    EligibilityRuleEvalDto,
    PolicyExplainerDto,
    PolicyExplainRequest,
    PolicySummaryDto,
    RightBenefitItemDto,
)
from app.domains.policy_explainer.voice_synthesizer import (
    synthesize_regional_explainer_audio,
)

logger = logging.getLogger(__name__)


class PolicyExplainerService:
    """Business operations for policy document ingestion, search, and multilingual RAG."""

    @staticmethod
    async def create_policy_document(
        db: AsyncSession,
        file_bytes: bytes,
        filename: str,
        title: str,
        reference_code: str,
        doc_type: str,
        issuing_body: str,
        target_group: str,
        uploaded_by: uuid.UUID | None = None,
    ) -> PolicySummaryDto:
        # Check duplicate reference_code
        existing = await db.execute(
            select(PolicyDocument).where(PolicyDocument.reference_code == reference_code)
        )
        if existing.scalar_one_or_none() is not None:
            raise ConflictException(
                code="POLICY_ALREADY_EXISTS",
                message=f"A policy with reference code '{reference_code}' already exists.",
            )

        # Parse PDF and extract clauses
        raw_text, clauses = extract_clauses_from_pdf(file_bytes)

        # Upload source PDF to storage
        clean_filename = f"{reference_code}_{filename}"
        source_pdf_url = await storage_service.upload_bytes(
            file_bytes,
            folder="policies",
            filename=clean_filename,
            content_type="application/pdf",
        )

        policy_id = uuid.uuid4()
        policy = PolicyDocument(
            id=policy_id,
            title=title,
            reference_code=reference_code,
            doc_type=doc_type,
            issuing_body=issuing_body,
            target_group=target_group,
            source_pdf_url=source_pdf_url,
            raw_text=raw_text,
            structured_rules={},
            status="INDEXED",
            clause_count=len(clauses),
            uploaded_by=uploaded_by,
        )
        db.add(policy)
        await db.flush()

        for clause in clauses:
            emb = compute_text_embedding(clause["content"])
            chunk = PolicyClauseChunk(
                policy_id=policy_id,
                chunk_index=clause["chunk_index"],
                page_number=clause["page_number"],
                clause_label=clause["clause_label"],
                content=clause["content"],
                embedding=emb,
            )
            db.add(chunk)

        await db.commit()
        await db.refresh(policy)

        return PolicySummaryDto(
            id=policy.id,
            title=policy.title,
            reference_code=policy.reference_code,
            doc_type=policy.doc_type,
            issuing_body=policy.issuing_body,
            target_group=policy.target_group,
            status=policy.status,
            clause_count=policy.clause_count,
            source_pdf_url=policy.source_pdf_url,
            published_date=policy.published_date,
            created_at=policy.created_at,
        )

    @staticmethod
    async def list_policies(
        db: AsyncSession,
        search: str | None = None,
        doc_type: str | None = None,
        target_group: str | None = None,
        page: int = 1,
        page_size: int = 12,
    ) -> tuple[list[PolicySummaryDto], PaginatedMeta]:
        stmt = select(PolicyDocument)
        count_stmt = select(func.count(PolicyDocument.id))

        if search:
            search_filter = or_(
                PolicyDocument.title.ilike(f"%{search}%"),
                PolicyDocument.reference_code.ilike(f"%{search}%"),
                PolicyDocument.issuing_body.ilike(f"%{search}%"),
            )
            stmt = stmt.where(search_filter)
            count_stmt = count_stmt.where(search_filter)

        if doc_type:
            stmt = stmt.where(PolicyDocument.doc_type == doc_type)
            count_stmt = count_stmt.where(PolicyDocument.doc_type == doc_type)

        if target_group:
            stmt = stmt.where(PolicyDocument.target_group == target_group)
            count_stmt = count_stmt.where(PolicyDocument.target_group == target_group)

        total_records = (await db.execute(count_stmt)).scalar_one()

        offset = (page - 1) * page_size
        stmt = stmt.order_by(PolicyDocument.created_at.desc()).offset(offset).limit(page_size)
        rows = (await db.execute(stmt)).scalars().all()

        items = [
            PolicySummaryDto(
                id=p.id,
                title=p.title,
                reference_code=p.reference_code,
                doc_type=p.doc_type,
                issuing_body=p.issuing_body,
                target_group=p.target_group,
                status=p.status,
                clause_count=p.clause_count,
                source_pdf_url=p.source_pdf_url,
                published_date=p.published_date,
                created_at=p.created_at,
            )
            for p in rows
        ]

        meta = PaginatedMeta.build(
            page=page,
            page_size=page_size,
            total_items=total_records,
        )

        return items, meta

    @staticmethod
    async def get_policy_by_id(db: AsyncSession, policy_id: uuid.UUID) -> PolicySummaryDto:
        stmt = select(PolicyDocument).where(PolicyDocument.id == policy_id)
        policy = (await db.execute(stmt)).scalar_one_or_none()
        if policy is None:
            raise NotFoundException(
                code="POLICY_NOT_FOUND",
                message=f"Policy with id '{policy_id}' not found.",
            )
        return PolicySummaryDto(
            id=policy.id,
            title=policy.title,
            reference_code=policy.reference_code,
            doc_type=policy.doc_type,
            issuing_body=policy.issuing_body,
            target_group=policy.target_group,
            status=policy.status,
            clause_count=policy.clause_count,
            source_pdf_url=policy.source_pdf_url,
            published_date=policy.published_date,
            created_at=policy.created_at,
        )

    @staticmethod
    async def explain_policy_for_user(
        db: AsyncSession,
        policy_id: uuid.UUID,
        request: PolicyExplainRequest,
        user_id: uuid.UUID | None = None,
    ) -> PolicyExplainerDto:
        stmt = select(PolicyDocument).where(PolicyDocument.id == policy_id)
        policy = (await db.execute(stmt)).scalar_one_or_none()
        if policy is None:
            raise NotFoundException(
                code="POLICY_NOT_FOUND",
                message=f"Policy with id '{policy_id}' not found.",
            )

        citizen_profile: dict[str, Any] = {
            "annual_income": 200000,
            "state": "Madhya Pradesh",
            "is_msme": False,
            "occupation": "Citizen",
            "category": "General",
        }

        # If custom override passed, use it
        if request.custom_profile_override:
            citizen_profile.update(request.custom_profile_override)
        elif user_id:
            try:
                decrypted = await IdentityService().get_decrypted_vault(db, user_id)
                citizen_profile.update(decrypted.public_profile.model_dump())
            except Exception as exc:
                logger.warning("Could not load decrypted vault for user %s: %s", user_id, exc)

        eval_result = await evaluate_policy_eligibility(
            db=db,
            policy=policy,
            citizen_profile=citizen_profile,
            language_code=request.language_code,
            persona_type=request.persona_type,
        )

        explainer_id = uuid.uuid4()
        audio_url, duration_sec = await synthesize_regional_explainer_audio(
            text_script=eval_result["plain_language_summary"],
            language_code=request.language_code,
            explainer_id=str(explainer_id),
        )

        explainer = PolicyVoiceExplainer(
            id=explainer_id,
            policy_id=policy_id,
            user_id=user_id,
            language_code=request.language_code,
            persona_type=request.persona_type,
            eligibility_status=eval_result["eligibility_status"],
            plain_language_summary=eval_result["plain_language_summary"],
            rights_and_benefits=eval_result["rights_and_benefits"],
            eligibility_evaluation=eval_result["eligibility_evaluation"],
            real_world_impacts=eval_result["real_world_impacts"],
            audio_explainer_url=audio_url,
            audio_duration_sec=duration_sec,
        )
        db.add(explainer)
        await db.commit()
        await db.refresh(explainer)

        return PolicyExplainerDto(
            explainer_id=explainer.id,
            policy_id=explainer.policy_id,
            language_code=explainer.language_code,
            persona_type=explainer.persona_type,
            eligibility_status=cast(Any, explainer.eligibility_status),
            plain_language_summary=explainer.plain_language_summary,
            rights_and_benefits=[
                RightBenefitItemDto(**rb) if isinstance(rb, dict) else rb
                for rb in (explainer.rights_and_benefits or [])
            ],
            eligibility_evaluation=[
                EligibilityRuleEvalDto(**ee) if isinstance(ee, dict) else ee
                for ee in (explainer.eligibility_evaluation or [])
            ],
            real_world_impacts=explainer.real_world_impacts,
            audio_explainer_url=explainer.audio_explainer_url,
            audio_duration_sec=explainer.audio_duration_sec,
            created_at=explainer.created_at,
        )
