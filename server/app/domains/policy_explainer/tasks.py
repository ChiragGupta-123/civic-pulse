"""Celery background tasks for Policy Explainer."""

from __future__ import annotations

import logging

logger = logging.getLogger(__name__)


def process_policy_document_task(policy_id: str) -> None:
    """Background task for heavy document OCR or re-indexing."""
    logger.info("Processing background indexing for policy: %s", policy_id)

