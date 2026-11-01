"""Shared pytest fixtures for the Civic Pulse backend test suite."""

from __future__ import annotations

from collections.abc import AsyncGenerator

import httpx
import pytest

from app.core.database import engine
from app.core.redis_bus import redis_client
from app.main import app


@pytest.fixture(autouse=True)
async def cleanup_engine():
    """Ensure database connection pool is disposed cleanly between test functions."""
    yield
    await engine.dispose()
    try:
        close_redis = getattr(redis_client, "aclose", redis_client.close)
        await close_redis()
    except Exception:
        pass


@pytest.fixture
async def client() -> AsyncGenerator[httpx.AsyncClient, None]:
    """Async FastAPI test client using the supported ASGI transport API.

    ``httpx.ASGITransport`` does not run the application lifespan, so these
    tests remain independent of PostgreSQL, Redis, and MinIO availability.
    """
    transport = httpx.ASGITransport(app=app, raise_app_exceptions=False)
    async with httpx.AsyncClient(
        transport=transport,
        base_url="http://testserver",
    ) as async_client:
        yield async_client
