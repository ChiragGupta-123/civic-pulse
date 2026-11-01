"""Human-in-the-Loop (HITL) Coordinator for Bureaucracy Agent.

Stores and coordinates citizen responses (OTP, CAPTCHA) using Redis
with an in-memory asyncio fallback for offline tests.
"""

from __future__ import annotations

import asyncio
import json
import logging
import uuid
from typing import Any

from app.core.redis_bus import redis_client

logger = logging.getLogger(__name__)

# In-memory storage and events for offline/mock fallback
_in_memory_store: dict[str, dict[str, Any]] = {}
_in_memory_events: dict[str, asyncio.Event] = {}


async def supply_hitl_input(
    run_id: uuid.UUID | str,
    obstacle_type: str,
    user_input: str,
) -> None:
    """Supply user input to resolve an agent obstacle (e.g. OTP)."""
    key = f"agent:hitl:{run_id}"
    payload = {
        "run_id": str(run_id),
        "obstacle_type": obstacle_type,
        "user_input": user_input,
    }

    # 1. Update in-memory fallback
    _in_memory_store[key] = payload
    if key in _in_memory_events:
        _in_memory_events[key].set()

    # 2. Update Redis
    try:
        await redis_client.set(key, json.dumps(payload), ex=1800)
    except Exception as exc:
        logger.warning("Failed to store HITL input in Redis: %s (using in-memory)", exc)


async def wait_for_hitl_input(
    run_id: uuid.UUID | str,
    timeout_sec: float = 120.0,
    poll_interval: float = 0.5,
) -> str:
    """Poll until citizen supplies HITL input or timeout is reached."""
    key = f"agent:hitl:{run_id}"
    event = _in_memory_events.setdefault(key, asyncio.Event())
    event.clear()

    start_time = asyncio.get_event_loop().time()

    while True:
        # Check in-memory first
        if key in _in_memory_store:
            data = _in_memory_store.pop(key)
            _in_memory_events.pop(key, None)
            return data["user_input"]

        # Check Redis
        try:
            val = await redis_client.get(key)
            if val:
                await redis_client.delete(key)
                _in_memory_events.pop(key, None)
                data = json.loads(val)
                return data["user_input"]
        except Exception as exc:
            logger.debug("Redis poll exception: %s", exc)

        elapsed = asyncio.get_event_loop().time() - start_time
        if elapsed >= timeout_sec:
            _in_memory_events.pop(key, None)
            raise TimeoutError(f"Timed out waiting for HITL input on run {run_id}")

        try:
            await asyncio.wait_for(event.wait(), timeout=poll_interval)
        except TimeoutError:
            pass
