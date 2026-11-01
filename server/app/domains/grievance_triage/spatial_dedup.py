"""Spatial deduplication for civic grievance tickets using PostGIS."""

from __future__ import annotations

import logging

from geoalchemy2 import Geography
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.grievance_triage.models import GrievanceTicket

logger = logging.getLogger(__name__)


async def find_nearby_duplicate_ticket(
    db: AsyncSession,
    latitude: float,
    longitude: float,
    category: str,
    radius_meters: float = 50.0,
) -> GrievanceTicket | None:
    """Find the closest existing open primary ticket within radius_meters for the same category.

    Filters for:
    - Same category
    - Active status (TRIAGED or IN_PROGRESS)
    - Primary ticket (duplicate_of_id is None)
    - Distance within radius_meters using PostGIS ST_DWithin on geography
    """
    point_geog = func.ST_SetSRID(func.ST_MakePoint(longitude, latitude), 4326).cast(Geography)
    stmt = (
        select(GrievanceTicket)
        .where(
            GrievanceTicket.category == category,
            GrievanceTicket.status.in_(["TRIAGED", "IN_PROGRESS"]),
            GrievanceTicket.duplicate_of_id.is_(None),
            func.ST_DWithin(GrievanceTicket.geom, point_geog, radius_meters),
        )
        .order_by(func.ST_Distance(GrievanceTicket.geom, point_geog).asc())
        .limit(1)
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()

